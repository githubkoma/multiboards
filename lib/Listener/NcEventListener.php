<?php

///
// Thanks to: https://github.com/kirstenhh/nc-bpm-app/
//

namespace OCA\MultiBoards\Listener;

use OCA\Files\Event\LoadAdditionalScriptsEvent;
use OCA\Files_Sharing\Event\BeforeTemplateRenderedEvent;
use OCA\MultiBoards\AppInfo\Application;
use OCP\AppFramework\Services\IInitialState;
use OCP\EventDispatcher\Event;
use OCP\EventDispatcher\IEventListener;

class NcEventListener implements IEventListener {
	/** @var IInitialState */
	private $initialState;

	public function __construct(IInitialState $initialState) {
		$this->initialState = $initialState;
	}

	//
	// https://docs.nextcloud.com/server/latest/developer_manual/basics/events.html
	//
	public function handle(Event $event): void {
		if (!($event instanceof LoadAdditionalScriptsEvent) &&
			!($event instanceof BeforeTemplateRenderedEvent)) {
			return;
		}

		if ($event instanceof BeforeTemplateRenderedEvent) {
			/** @var BeforeTemplateRenderedEvent $event */
			$share = $event->getShare();

			$this->initialState->provideInitialState('share', [
				'permissions' => $share->getPermissions(),
				'nodeType' => $share->getNodeType(),
				'nodeId' => $share->getNodeId(),				
				'shareToken' => $share->getToken(),				
				'fullId' => $share->getFullId(),	
			]);

			\OCP\Util::addScript(Application::APP_ID, 'filesintegration');

		} else {
			$ncVersion = substr(\OC::$server->getConfig()->getSystemValueString("version"), 0, 2);			
			if ($ncVersion < 28) { // https://docs.nextcloud.com/server/latest/developer_manual/app_publishing_maintenance/app_upgrade_guide/upgrade_to_28.html
				\OCP\Util::addScript(Application::APP_ID, 'filesintegration');
			} else {				
				\OCP\Util::addInitScript(Application::APP_ID, 'filesintegration');
			}
		}		
	}
}