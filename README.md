# Welcome to Anywhere Comment Extension!

## Description

Extension that enables you to comment on any website.

This project is made by Seungwoo Jo and submitted to [Atlas Madness Hackathon](https://atlasmadness.devpost.com/).

Available on the following link.

- Extension (Chrome Web Store): https://chrome.google.com/webstore/detail/anywhere-comment-extensio/iedldbceicpbnlnkooemekofheoieppc
- Web: https://anywhere.seungwoojo.com

## Source code directory structure

```
anywhere-chrome-extension/  - Chrome extension source
anywhere-web/               - Website source
anywhere-server/            - Application server source
anywhere-docs/              - Documentation
```

## How to run

### Chrome extension

1. Go to the Extensions page by entering `chrome://extensions` in a new tab.
2. Enable Developer mode.
3. Click the **Load unpacked** button and select the `anywhere-chrome-extension/src` directory.

For more information, visit the following website. https://developer.chrome.com/docs/extensions/mv3/getstarted/development-basics/#load-unpacked

### Web

In the `anywhere-web/src` directory, execute following commands.

```bash
$ npm run install
$ npm run start
```

Server should be available at port 1234. You might have to adjust `anywhere-web/src/utils/constants.js` to point the correct application server. Production application server does not allow cross origin request from http://<span></span>localhost:1234.

### Application server

In the `anywhere-server/src` directory, execute following commands.

```bash
$ npm run install
$ npm run start
```

Server should be available at port 4000. You might have to create `anywhere-server/env/.env` file so that it can be injected the correct environment variables. Please refer to `anywhere-server/env/.env-example` file.

## Resources

- Atlas Madness Hackathon: https://atlasmadness.devpost.com/
- Google Cloud architecture diagramming tool: https://googlecloudcheatsheet.withgoogle.com/architecture
  - Can be used to open the .excalidraw diagram inside the anywhere-docs
- Demo video: https://youtu.be/cEMVeOPI1H8