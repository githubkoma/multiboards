<?php

declare(strict_types=1);
/**
 * https://docs.nextcloud.com/server/latest/developer_manual/app_publishing_maintenance/app_upgrade_guide/index.html
 */

namespace OCA\MultiBoards\AppInfo;

use OCP\AppFramework\App;
use OCP\AppFramework\Bootstrap\IBootContext;
use OCP\AppFramework\Bootstrap\IBootstrap;
use OCP\AppFramework\Bootstrap\IRegistrationContext;
use OCP\AppFramework\Http\ContentSecurityPolicy;
use OCP\Util;
//use OCP\EventDispatcher\IEventDispatcher; 
use OCA\MultiBoards\Listener\NcEventListener;
use OCA\Files\Event\LoadAdditionalScriptsEvent; 
use OCA\Files_Sharing\Event\BeforeTemplateRenderedEvent;

use OCA\MultiBoards\Notification\Notifier;

class Application extends App implements IBootstrap {
        public const APP_ID = 'multiboards';	

        public function __construct() {
                parent::__construct(self::APP_ID);
                $appConfig = \OC::$server->getAppConfig();                

                $manager = $this->getContainer()->getServer()->getContentSecurityPolicyManager();
                $policy = new ContentSecurityPolicy();

                //Util::addHeader('meta', ['property' => "Stuff", 'content' => 'ValueXYZ']);

                //$policy->addAllowedStyleDomain('fonts.googleapis.com');                                              
                $policy->addAllowedFrameDomain('*');
                $policy->addAllowedImageDomain('*');
                
                // Allow Connection to Synprovider
                if ($appConfig->getValue(self::APP_ID, "syncProviderUrl") == "") 
                  { 
                    $syncProviderUrl = "ws://localhost:4444"; // fallback for store.ts      
                    $appConfig->setValue(self::APP_ID, "syncProviderUrl", $syncProviderUrl);
                  } else { 
                    $syncProviderUrl = $appConfig->getValue(self::APP_ID, "syncProviderUrl");
                  }
                $policy->addAllowedConnectDomain($syncProviderUrl);                
                $manager->addDefaultPolicy($policy);
       
	}

        // Register to Hooks that NC fires
        public function register(IRegistrationContext $context): void {
                //$context->registerDashboardWidget(Widget::class);               
                //$context->registerNotifierService(Notifier::class);      
		$context->registerEventListener(LoadAdditionalScriptsEvent::class, NcEventListener::class);
		$context->registerEventListener(BeforeTemplateRenderedEvent::class, NcEventListener::class);  
        }

        public function boot(IBootContext $context): void {
                // this runs every time Nextcloud loads a page if this app is enabled
                //$this->registerFilesActivity();                
        }

}
