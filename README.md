# react-native-image-exif

Package for extracting image EXIF ​​(metadata) in React Native

## Installation


```sh
npm install react-native-image-exif
```


## Usage


```js
import { getExifFromPath } from 'react-native-image-exif';

// Local file path (Vision Camera PhotoFile.path 등). `file://` 접두사는 제거됩니다.

const exif = await getExifFromPath(path);
```


## Contributing

- [Development workflow](CONTRIBUTING.md#development-workflow)
- [Sending a pull request](CONTRIBUTING.md#sending-a-pull-request)
- [Code of conduct](CODE_OF_CONDUCT.md)

## License

MIT

---

Made with [create-react-native-library](https://github.com/callstack/react-native-builder-bob)
