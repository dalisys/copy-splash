# Unsplash Image Link Copier

Easily copy the direct URL of any free image on Unsplash with a single click! Perfect for developers, designers, or anyone looking to quickly integrate Unsplash images into their code or use them as embedded content.

## Features

- **Copy Image URL**: A "Copy Link" button appears over each free Unsplash image, allowing you to instantly copy the image URL to your clipboard.
- **URL Customization**: Click on the extension icon to open the settings menu and customize the copied URL. Set default parameters like width, height, quality, and more using the [imgix Rendering API](https://docs.imgix.com/apis/rendering/overview).
- **Excludes Paid Content**: The extension works only with free images. Paid content is automatically excluded.

## Installation

1. **Clone or Download the Repository:**

   ```bash
   git clone https://github.com/yourusername/unsplash-image-link-copier.git
   ```
    ```bash
   cd unsplash-image-link-copier
    ```
2. **Load the Extension in Chrome:**
   - Open Chrome and navigate to `chrome://extensions/`.
   - Enable "Developer mode" (top right corner).
   - Click "Load unpacked" and select the folder containing the extension files.

## Usage

1. **Copy Image URLs:**
   - Visit [Unsplash](https://unsplash.com/).
   - Hover over any free image to see the "Copy Link" button.
   - Click the button to copy the image URL to your clipboard.

2. **Customize URLs:**
   - Click on the extension icon in the Chrome toolbar.
   - Set your preferred default parameters (e.g., width, height, quality) for the copied image URL.
   - Save your settings to apply them automatically to every copied link.

## Permissions

The extension requires the following permissions:

- **`clipboardWrite`**: To copy the image URL to the clipboard.
- **`storage`**: To save user-defined settings like default image parameters.
- **`Host permissions`**: To access Unsplash domains and modify the page content.

## Contributing

We welcome contributions! Please follow these steps:

1. Fork the repository.
2. Create a new branch (`git checkout -b feature-branch`).
3. Make your changes.
4. Commit your changes (`git commit -m 'Add new feature'`).
5. Push to the branch (`git push origin feature-branch`).
6. Open a pull request.

## License

This project is licensed under the MIT License - see the [LICENSE](https://github.com/git/git-scm.com/blob/main/MIT-LICENSE.txt) file for details.

## Acknowledgements

- [Unsplash](https://unsplash.com/) for their amazing free images.
- [imgix](https://docs.imgix.com/apis/rendering/overview) for the image rendering API.

## Feedback

For feedback, suggestions, or issues, please create an issue in the repository or contact me directly.
