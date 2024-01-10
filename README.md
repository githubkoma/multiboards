# MultiBoards (Nextcloud App)
- Create Digital Boards from your content in Nextcloud
- Use it for Mindmaps, Visualizations, Knowledge Management, ...
- Based on [Reactflow](https://reactflow.dev/)

![](https://raw.githubusercontent.com/githubkoma/multiboards/main/img/screenshot.jpg)

## Install the app
- Either via https://apps.nextcloud.com
- or Place this app in **nextcloud/apps/**

## Use the app
- Create new MultiBoard within the Files Overview
- Write, Edit and Connect on Board: Text Nodes, `.md` Documents, Images, PDFs
- Share Boards to the Public (only for single `.mboard` File, not a Shared Folder)

## Building the app

### Javascript
React:
```
js/flow/$ npm install
js/flow/$ npm run build
```

Filesintegration:
```
js/filesintegration/$ npm install
js/filesintegration/$ npm run build
```

#### React
- Sources located in `js/flow/`
- Build: js automatically located in `js/flow/build/static/js/`
  - MANUALLY adapt references in `templates/index.php`

##### CSS
- Build: MANUALLY place in `css/`
  - MANUALLY adapt reference in `templates/index.php`

#### FilesApp Integration
- Sources located in `js/filesintegration/`

created like so:
```
js$ mkdir filesintegration
js$ cd filesintegration
filesintegration$ npm init -y
filesintegration$ npm install webpack webpack-cli --save-dev
filesintegration$ npm install @nextcloud/files
filesintegration$ vi package.json
filesintegration$ vi webpack.config.js
```

### PHP 
- located in `lib/`
- `AppInfo/Application.php` registers `NcEventListener.php` to integrate into FilesApp
  - `BeforeTemplateRenderedEvent` is for SingleFile Public Share
  - `LoadAdditionalScriptsEvent` is for FileList Integration

### HTML
- templates (php format) located in `templates/`
- root `index.php` includes script + css references

## Publish the App
- [Publish the App on the Appstore](https://nextcloudappstore.readthedocs.io/en/latest/developer.html#publishing-apps-on-the-app-store)
- [App Upgrade Guide](https://docs.nextcloud.com/server/latest/developer_manual/app_publishing_maintenance/app_upgrade_guide/index.html)