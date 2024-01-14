<?php

namespace OCA\MultiBoards\Controller;

use OCP\AppFramework\Controller;
use OCP\AppFramework\Http\DataResponse;
use OCP\AppFramework\Http\StreamResponse;
use OCP\IRequest;
use OCP\Share\IManager;
use OCP\ISession;
use OCP\Constants;
use OCP\Files\IMimeTypeDetector;

use OCP\Share\Exceptions\ShareNotFound;
use OCP\Files\ForbiddenException;
use OCP\Files\NotFoundException;

class FileController extends Controller {
	private $userId;
    
	private $session;
	private $shareManager;
	private IMimeTypeDetector $mimeTypeDetector;

	use Errors;

	public function __construct($AppName, 
								IRequest $request, 
								ISession $session,
								IManager $shareManager,
								IMimeTypeDetector $mimeTypeDetector,
								$UserId){
		parent::__construct($AppName, $request);
		$this->userId = $UserId;
		$this->session = $session;
		$this->request = $request;
		$this->shareManager = $shareManager;
		$this->mimeTypeDetector = $mimeTypeDetector;
	}

	// OCS-OPENAPI: https://docs.nextcloud.com/server/latest/developer_manual/client_apis/OCS/ocs-openapi.html

	/**
	 * CAUTION: the @Stuff turns off security checks; for this page no admin is
	 *          required and no CSRF check. If you don't know what CSRF is, read
	 *          it up in the docs or you might create a security hole. This is
	 *          basically the only required method to add this exemption, don't
	 *          add it to any other method if you don't exactly know what it does
	 *
	 * @NoAdminRequired
	 * @ NoCSRFRequired
	 * @PublicPage
	 */	 
    public function getFileInfo(int $fileId, string $shareToken, $filePath) {  
		/*
		only fileId = logged in user looks for mboard or media file
		only filePath = logged in user looks for media file he chose with filepicker
		only shareToken = public user looks for mboard by shareToken
		fileId & shareToken = public user looks for media file
		*/		

		$response = $this->handleServiceErrors(function () use($fileId, $shareToken, $filePath) {			
			return $this->getFileInfoService($fileId, $shareToken, $filePath);
		});	

		return $response;

	}

	/**
	 * CAUTION: the @Stuff turns off security checks; see above
	 *
	 * @NoAdminRequired
	 * @ NoCSRFRequired
	 * @PublicPage
	 */	 	
    public function saveFile(int $fileId, string $shareToken, string $fileContent) {

		$response = $this->handleServiceErrors(function () use($fileId, $shareToken, $fileContent) {			
			return $this->saveFileService($fileId, $shareToken, $fileContent);			
		});	

		return $response;
	}
	
	/**
	 * CAUTION: the @Stuff turns off security checks; see above
	 *
	 * @NoAdminRequired
	 * @NoCSRFRequired
	 * @PublicPage
	 */	 
    public function loadMediaFile(int $fileId) { 

		$fileInfo = $this->getFileInfoService($fileId, $shareToken = "null", $filePath = "");		
		if ($fileInfo["nodeType"] == "dir") {		
			//throw new NotFoundException();				
			$message = ['message' => "Error: Not Found"];
			return new DataResponse($message, Http::STATUS_NOT_FOUND);
		}

		/* PERMISSION_READ = 1; PERMISSION_UPDATE = 2; PERMISSION_CREATE = 4; PERMISSION_DELETE = 8; PERMISSION_SHARE = 16; PERMISSION_ALL = 31; */
		if ( ($fileInfo["permissions"] >= Constants::PERMISSION_READ && $fileInfo["permissions"] < Constants::PERMISSION_SHARE) ||  // min READ Only (1+), below ShareType (16)
			($fileInfo["permissions"] >= Constants::PERMISSION_SHARE+Constants::PERMISSION_READ) ) // min Sharetype + READ Only (17=16+1)
			{	

			try {
						
				$fileNode = \OC::$server->getRootFolder()->getById($fileId)[0]; // https://github.com/nextcloud/server/blob/master/lib/private/Files/Node/Node.php																
				$mimeType = $this->mimeTypeDetector->getSecureMimeType($fileNode->getMimeType());				
				if (str_contains($mimeType, "image") || str_contains($mimeType, "pdf")) {				
					// https://github.com/nextcloud/notes/blob/main/lib/Controller/NotesController.php#L317				
					$response = new StreamResponse($fileNode->fopen('rb'));
					$response->addHeader('Content-Disposition', 'attachment; filename="' . rawurldecode($fileNode->getName()) . '"');
					$response->addHeader('Content-Type', $mimeType . "; charset=utf-8");
					$response->addHeader('Cache-Control', 'public, max-age=604800');									
				
				} else {
					$response = new DataResponse($fileNode->getContent());
				}

				return $response;

			} catch (\Exception $e) {
				//return ["Error", $e->getMessage(), $e->getTraceAsString()];
				$message = ['message' => "Error: Not Found"];
				return new DataResponse($message, Http::STATUS_NOT_FOUND);
			}


		} else {
			//throw new ForbiddenException("Forbidden", "");
			$message = ['message' => "Error: Not Found"];
			return new DataResponse($message, Http::STATUS_NOT_FOUND);
		}
			
	}

    private function saveFileService(int $fileId, string $shareToken, string $fileContent) {   		

		$fileInfo = $this->getFileInfoService($fileId, $shareToken, $filePath = "");

		if ($fileInfo["nodeType"] == "dir") {
			throw new NotFoundException();
		}

		/* PERMISSION_READ = 1; PERMISSION_UPDATE = 2; PERMISSION_CREATE = 4; PERMISSION_DELETE = 8; PERMISSION_SHARE = 16; PERMISSION_ALL = 31; */
		if ( ($fileInfo["permissions"] > Constants::PERMISSION_READ && $fileInfo["permissions"] < Constants::PERMISSION_SHARE) ||  // above READ Only (1+), below ShareType (16)
			 ($fileInfo["permissions"] > Constants::PERMISSION_SHARE+Constants::PERMISSION_READ) ) // Above Sharetype + READ Only (17=16+1)
			{		

			if ($shareToken == "null") {						
				$fileNode = \OC::$server->getRootFolder()->getById($fileId)[0]; // https://github.com/nextcloud/server/blob/master/lib/private/Files/Node/Node.php																
			} else {				
				$share = $this->shareManager->getShareByToken($shareToken);		
				$fileNode = $share->getNode();
			}

			$fileNode->putContent($fileContent);			

		} else {
			throw new ForbiddenException("Forbidden", "");
		}

		return $fileInfo;
	}

	private function getFileInfoService(int $fileId, string $shareToken, $filePath) { 

		$share = null;
		$fileNode = null;		

        try 
        {

			/* fileId & shareToken -> public user looks for media file */
			if ($fileId && !($shareToken == "null")) {
				$share = $this->shareManager->getShareByToken($shareToken);
				if ($fileId !== $share->getNodeId() || 
					($share->getPermissions() < Constants::PERMISSION_SHARE+Constants::PERMISSION_READ)) /* PERMISSION_READ = 1; PERMISSION_UPDATE = 2; PERMISSION_CREATE = 4; PERMISSION_DELETE = 8; PERMISSION_SHARE = 16; PERMISSION_ALL = 31; */
				{
					throw new NotFoundException();
				}
			} // now go on like the rest

			/* only fileId -> logged in user looks for mboard or media file */	
			if ($fileId) {						
				$nodeResult = \OC::$server->getRootFolder()->getById($fileId); // https://github.com/nextcloud/server/blob/master/lib/private/Files/Node/Node.php																				
				if (is_array($nodeResult)) {
					$fileNode = $nodeResult[0];
				} else {
					$fileNode = $nodeResult;
				}	
			
			} else { 

				/*	only shareToken -> public user looks for mboard by shareToken */	
				if (!($shareToken == "null")) {				
					$share = $this->shareManager->getShareByToken($shareToken);	
					/* check mboard's password protection and permissions*/					
					if ($share === null || $share === false
						|| ($share->getPassword() !== null && (!$this->session->exists("public_link_authenticated")
						|| $this->session->get("public_link_authenticated") !== (string) $share->getId()))
						|| ($share->getPermissions() < Constants::PERMISSION_SHARE+Constants::PERMISSION_READ)) /* PERMISSION_READ = 1; PERMISSION_UPDATE = 2; PERMISSION_CREATE = 4; PERMISSION_DELETE = 8; PERMISSION_SHARE = 16; PERMISSION_ALL = 31; */
					{
						throw new ForbiddenException();
					}

				/*	only filePath -> logged in user looks for media file he chose with filepicker
					e.g. find "/Folder 1/Nextcloud.png"
				*/
				} else {
					
					if ($filePath){	
						// get all occurences of "Nextcloud.png"					
						$arrFileSearchResult = \OC::$server->getUserFolder()->search(basename($filePath));												
						// find the file where the whole path matches
						foreach ($arrFileSearchResult as $key => $value) {																					
							$returnstring .= $value->getPath();
							if (str_contains($value->getPath(), $filePath)) {
								$fileNode = $value;
							}
						}						
					}
				}			
			}

        } catch (ShareNotFound $e) {			
            throw new NotFoundException();			
        }

		if (!$share && !$fileNode) {				
			throw new NotFoundException();			
		}

		if ($share) {						

			$arrFileInfo = array(				
				'fileId' => $share->getNodeId(),										
				'filePath' => "",
				'fileName' => $share->getNode()->getName(),	
				'permissions' => $share->getPermissions(),
				'nodeType' => $share->getNodeType(),			
				'shareToken' => $share->getToken(),									
				'mimeType' => $share->getNode()->getMimeType(),		
				'roomId' => crc32(strval($share->getNodeId())),					
			);			

		}

		if ($fileNode) {

			$arrFileInfo = array(				
				'fileId' => $fileNode->getId(),		
				'filePath' => $fileNode->getPath(),
				'fileName' => $fileNode->getName(),									
				'permissions' => $fileNode->getPermissions(),
				'nodeType' => $fileNode->getType(),			
				'shareToken' => "",		
				'mimeType' => $fileNode->getMimeType(),	
				'roomId' => crc32(strval($fileId)),	
			);			
			
		}

		return $arrFileInfo;
	}
}