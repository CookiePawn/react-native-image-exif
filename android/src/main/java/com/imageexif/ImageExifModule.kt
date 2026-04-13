package com.imageexif

import androidx.exifinterface.media.ExifInterface
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.WritableMap
import java.io.File
import java.lang.reflect.Modifier

class ImageExifModule(reactContext: ReactApplicationContext) :
  NativeImageExifSpec(reactContext) {

  override fun getExifFromPath(path: String, promise: Promise) {
    try {
      val cleanPath = path.removePrefix("file://").trim()
      if (cleanPath.isEmpty()) {
        promise.reject("E_INVALID_PATH", "Empty path")
        return
      }
      val file = File(cleanPath)
      if (!file.exists() || !file.isFile) {
        promise.reject("E_FILE_NOT_FOUND", "File not found: $cleanPath")
        return
      }

      val exif = ExifInterface(file)
      val map = buildExifMap(exif)
      promise.resolve(map)
    } catch (e: Exception) {
      promise.reject("E_EXIF_READ", e.message, e)
    }
  }

  private fun buildExifMap(exif: ExifInterface): WritableMap {
    val map = Arguments.createMap()

    for (tag in EXIF_TAG_NAMES) {
      val value = exif.getAttribute(tag) ?: continue
      if (value.isNotEmpty()) {
        map.putString(tag, value)
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

  companion object {
    const val NAME = NativeImageExifSpec.NAME

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
}
