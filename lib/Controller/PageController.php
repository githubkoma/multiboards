<?php
namespace OCA\MultiBoards\Controller;

use OCP\IRequest;
use OCP\AppFramework\Http\TemplateResponse;
use OCP\AppFramework\Http\Template\PublicTemplateResponse;
use OCP\AppFramework\Http\DataResponse;
use OCP\AppFramework\Controller;
use OCP\Util;

class PageController extends Controller {
	private $userId;

	public function __construct($AppName, IRequest $request, $UserId){
		parent::__construct($AppName, $request);
		$this->userId = $UserId;
	}

	/**
	 * CAUTION: the @Stuff turns off security checks; for this page no admin is
	 *          required and no CSRF check. If you don't know what CSRF is, read
	 *          it up in the docs or you might create a security hole. This is
	 *          basically the only required method to add this exemption, don't
	 *          add it to any other method if you don't exactly know what it does
	 *
	 * @NoAdminRequired
	 * @NoCSRFRequired
	 * @PublicPage
	 */	 
    public function index() {	
	
		if ($this->userId == "") {
	
			$template = new PublicTemplateResponse($this->appName, 'index', []);
			$template->setHeaderTitle('MultiBoards');
			$template->setHeaderDetails("Public");
			$template->setFooterVisible(false);
			
			$response = $template;
			//$response->setHeaders(['X-Frame-Options' => 'allow-from *']);		// Should be needed when this site is allowed to be embedded by 3rd party sites
			
		} else {
			$response = $this->indexLoggedIn();
		}
		
        return $response;
    }
	
	/**
	 * CAUTION: the @Stuff turns off security checks; for this page no admin is
	 *          required and no CSRF check. If you don't know what CSRF is, read
	 *          it up in the docs or you might create a security hole. This is
	 *          basically the only required method to add this exemption, don't
	 *          add it to any other method if you don't exactly know what it does
	 *
	 * @NoAdminRequired
	 * @NoCSRFRequired
	 */
	public function indexLoggedIn() {
		return new TemplateResponse($this->appName, 'index');  // templates/index.php
	}

}
