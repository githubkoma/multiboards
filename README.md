# MultiBoards (Nextcloud App)
- Based on [Reactflow](https://reactflow.dev/)
- Place this app in **nextcloud/apps/**

## Use the app
- Create new MultiBoard in the Files Overview
- Place on Canvas: Text Nodes, .md Documents, Images, PDF, ...

## Building the app
React:
`js/flow/$ npm install`
`js/flow/$ npm run build`

Filesintegration:
`js/filesintegration/$ npm install`
`js/filesintegration/$ npm run build`

### Javascript

#### React
- Sources located in `js/flow/`
- Build: js automatically located in `js/flow/build/static/js/`
  - MANUALLY adapt references in `templates/index.php`

#### CSS
- Build: MANUALLY place in `css/`
  - MANUALLY adapt reference in `templates/index.php`

#### filesintegration
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