package com.imageexif

import android.net.Uri
import android.util.Base64
import androidx.exifinterface.media.ExifInterface
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.WritableArray
import com.facebook.react.bridge.WritableMap
import java.io.File
import java.io.ByteArrayInputStream
import java.io.IOException
import java.lang.reflect.Modifier
import java.net.HttpURLConnection
import java.net.URL

class ImageExifModule(reactContext: ReactApplicationContext) :
  NativeImageExifSpec(reactContext) {

  override fun getExifFromPath(path: String, promise: Promise) {
    try {
      val source = path.trim()
      if (source.isEmpty()) {
        promise.reject("E_INVALID_PATH", "Empty path")
        return
      }

      val exif = readExif(source)
      val map = buildExifMap(exif)
      promise.resolve(map)
    } catch (e: InvalidSourceException) {
      promise.reject(e.code, e.message, e)
    } catch (e: Exception) {
      promise.reject("E_EXIF_READ", e.message, e)
    }
  }

  /**
   * Opens every Android source format accepted by the public JavaScript API.
   *
   * ExifInterface reads the supplied descriptor/stream synchronously, so resources can be
   * closed as soon as its constructor returns.
   */
  @Throws(IOException::class, InvalidSourceException::class)
  private fun readExif(source: String): ExifInterface {
    if (source.startsWith("data:", ignoreCase = true)) {
      return readDataUri(source)
    }

    val uri = Uri.parse(source)
    return when (uri.scheme?.lowercase()) {
      null -> readFile(File(source), source)
      "file" -> readFile(File(requireNotNull(uri.path) { "Missing file path" }), source)
      "content" -> {
        reactApplicationContext.contentResolver.openFileDescriptor(uri, "r")?.use {
          ExifInterface(it.fileDescriptor)
        } ?: throw InvalidSourceException("E_SOURCE_UNREADABLE", "Could not open content URI: $source")
      }
      "http", "https" -> readRemoteUrl(source)
      else -> throw InvalidSourceException("E_UNSUPPORTED_URI", "Unsupported image URI scheme: ${uri.scheme}")
    }
  }

  @Throws(InvalidSourceException::class)
  private fun readFile(file: File, source: String): ExifInterface {
    if (!file.exists() || !file.isFile) {
      throw InvalidSourceException("E_FILE_NOT_FOUND", "File not found: $source")
    }
    return ExifInterface(file)
  }

  @Throws(IOException::class, InvalidSourceException::class)
  private fun readDataUri(source: String): ExifInterface {
    val separator = source.indexOf(',')
    if (separator < 0) {
      throw InvalidSourceException("E_INVALID_DATA_URI", "Data URI is missing a payload")
    }
    val metadata = source.substring(0, separator)
    if (!metadata.contains(";base64", ignoreCase = true)) {
      throw InvalidSourceException("E_INVALID_DATA_URI", "Only base64-encoded data URIs are supported")
    }
    val payload = source.substring(separator + 1)
    val bytes = try {
      Base64.decode(payload, Base64.DEFAULT)
    } catch (e: IllegalArgumentException) {
      throw InvalidSourceException("E_INVALID_DATA_URI", "Invalid base64 image data", e)
    }
    if (bytes.isEmpty()) {
      throw InvalidSourceException("E_INVALID_DATA_URI", "Data URI payload is empty")
    }
    return ByteArrayInputStream(bytes).use(::ExifInterface)
  }

  @Throws(IOException::class, InvalidSourceException::class)
  private fun readRemoteUrl(source: String): ExifInterface {
    val connection = (URL(source).openConnection() as HttpURLConnection).apply {
      connectTimeout = REMOTE_TIMEOUT_MS
      readTimeout = REMOTE_TIMEOUT_MS
      instanceFollowRedirects = true
      requestMethod = "GET"
    }
    try {
      val status = connection.responseCode
      if (status !in 200..299) {
        throw InvalidSourceException("E_REMOTE_FETCH", "Could not fetch image (HTTP $status)")
      }
      return connection.inputStream.use(::ExifInterface)
    } finally {
      connection.disconnect()
    }
  }

  private fun buildExifMap(exif: ExifInterface): WritableMap {
    val map = Arguments.createMap()

    for (tag in EXIF_TAG_NAMES) {
      val value = exif.getAttribute(tag) ?: continue
      if (value.isNotEmpty()) {
        if (ARRAY_TAGS.contains(tag)) {
          val array = parseExifArray(tag, value)
          if (array != null && array.size() > 0) {
            map.putArray(tag, array)
          } else {
            putNormalizedValue(map, tag, value)
          }
        } else {
          putNormalizedValue(map, tag, value)
        }
      }
    }

    map.putInt("RotationDegrees", exif.rotationDegrees)

    val latLong = FloatArray(2)
    if (exif.getLatLong(latLong)) {
      map.putDouble("latitude", latLong[0].toDouble())
      map.putDouble("longitude", latLong[1].toDouble())
    }

    if (exif.hasAttribute(ExifInterface.TAG_GPS_ALTITUDE)) {
      map.putDouble("altitude", exif.getAltitude(0.0))
    }

    return map
  }

  private fun putNormalizedValue(map: WritableMap, key: String, raw: String) {
    val trimmed = raw.trim()
    if (trimmed.isEmpty()) return

    // Only coerce when it's a plain number literal (no fractions, colons, etc)
    if (NUMBER_LITERAL_REGEX.matches(trimmed)) {
      if (trimmed.contains('.')) {
        map.putDouble(key, trimmed.toDouble())
        return
      }

      val asLong = trimmed.toLongOrNull()
      if (asLong != null && asLong in Int.MIN_VALUE..Int.MAX_VALUE) {
        map.putInt(key, asLong.toInt())
        return
      }

      // Fallback for very large ints
      map.putDouble(key, trimmed.toDouble())
      return
    }

    map.putString(key, trimmed)
  }

  private fun parseExifArray(tag: String, value: String): WritableArray? {
    val trimmed = value.trim()
    if (trimmed.isEmpty()) return null

    // iOS는 ExifVersion/FlashPixVersion이 [2,3,2], [1,0] 형태로 내려옴.
    // Android는 보통 "0232", "0100" 같이 내려와서 앞의 0을 제거해 맞춘다.
    if (tag == ExifInterface.TAG_EXIF_VERSION || tag == ExifInterface.TAG_FLASHPIX_VERSION) {
      val digits = trimmed.filter { it.isDigit() }
      if (digits.length >= 2) {
        val ints = digits.map { it.toString().toInt() }.dropWhile { it == 0 }
        if (ints.isNotEmpty()) {
          val arr = Arguments.createArray()
          for (n in ints) arr.pushInt(n)
          return arr
        }
      }
    }

    // 일반 숫자/문자열 리스트: "1,2,3", "1 2 3", "(1, 2, 3)" 등을 모두 허용
    val numberRegex = Regex("""[-+]?\d+(\.\d+)?""")
    val matches = numberRegex.findAll(trimmed).map { it.value }.toList()
    if (matches.isEmpty()) return null

    val arr = Arguments.createArray()
    for (m in matches) {
      if (m.contains('.')) {
        arr.pushDouble(m.toDouble())
      } else {
        // int 범위를 넘어도 double로 안전하게 담음
        val asLong = m.toLongOrNull()
        if (asLong != null && asLong in Int.MIN_VALUE..Int.MAX_VALUE) {
          arr.pushInt(asLong.toInt())
        } else {
          arr.pushDouble(m.toDouble())
        }
      }
    }
    return arr
  }

  companion object {
    const val NAME = NativeImageExifSpec.NAME
    private const val REMOTE_TIMEOUT_MS = 15_000

    private val NUMBER_LITERAL_REGEX = Regex("""[-+]?\d+(\.\d+)?""")

    private val ARRAY_TAGS: Set<String> = setOf(
      ExifInterface.TAG_COMPONENTS_CONFIGURATION,
      ExifInterface.TAG_EXIF_VERSION,
      ExifInterface.TAG_FLASHPIX_VERSION,
      ExifInterface.TAG_ISO_SPEED_RATINGS,
      ExifInterface.TAG_LENS_SPECIFICATION,
      ExifInterface.TAG_SUBJECT_AREA
    )

    private val EXIF_TAG_NAMES: List<String> by lazy {
      ExifInterface::class.java.fields
        .asSequence()
        .filter { field ->
          Modifier.isStatic(field.modifiers) &&
            field.type == String::class.java &&
            field.name.startsWith("TAG_")
        }
        .mapNotNull { field ->
          try {
            field.get(null) as? String
          } catch (_: Exception) {
            null
          }
        }
        .distinct()
        .sorted()
        .toList()
    }
  }

  private class InvalidSourceException(
    val code: String,
    override val message: String,
    cause: Throwable? = null,
  ) : Exception(message, cause)
}
