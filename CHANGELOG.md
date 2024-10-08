# Change Log
All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](http://keepachangelog.com/)
and this project adheres to [Semantic Versioning](http://semver.org/).

## 1.0.4

### Added

- Support for NC30

### Fixed 

- Changed New Board File Naming: Time delimiter ":" is now "-" (https://github.com/githubkoma/multiboards/issues/4)

## 1.0.3

### Added

- Support for NC29

### Changed 

- Outside Nodes: Action Menu Switcher instead of 4+ Buttons above
- Inside Text- and FileNodes: Resolve Relative img URL to display the img
- Inside FileNodes: Scroll Button positioning slightly changed 

## 1.0.2

### Added

- Added Scrollbuttons within Text- and FileNodes

### Changed

- More Server-Side Logging possibilities in FileController.php
- appConfig now propagated to Frontend via Application.php

### Fixed

- Different Logged in User couldnt open a Board despite Read Permission

## 1.0.1

### Added

- This Changelog 😉

### Changed

- Open `<a href=` in new Tab
- TextNode + Edge: Textarea/Input Field now uses white Text Color

### Fixed

- Use urlencode in ajax calls
- FileNode: Modal doesnt show iFrame twice anylonger when in Public Share
- FileNode: Fixed the Reload of content after closing the iFrame

## 1.0.0

First Release of MultiBoards for Nextcloud
