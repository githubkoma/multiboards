<?php
//script('multiboards', 'script');
script('multiboards', 'flow/build/static/js/main.1000d0af');
script('multiboards', 'flow/build/static/js/787.4deb9fb9.chunk');
style('multiboards', 'main.09f38393');
?>

<?php 
$appConfig = \OC::$server->getAppConfig();
$syncProviderUrl = $appConfig->getValue("multiboards", "syncProviderUrl"); // experimental: sudo -u www-data php /var/www/html/occ config:app:set "multiboards" "syncProviderUrl" --value "ws://localhost:4444/"
?>

<input type="hidden" id="userBoardEditPermission" style="display: none;" /> <!-- Runtime filled -->

<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0, user-scalable=no, target-densityDpi=device-dpi" />
<div id="content" style="margin-top: -1px; margin-left: -1px;">
	<div id="app-content">
		<!-- react lives here -->
	</div>
</div>