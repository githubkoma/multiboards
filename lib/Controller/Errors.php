<?php

namespace OCA\MultiBoards\Controller;

use Closure;

use OCP\AppFramework\Http;
use OCP\AppFramework\Http\DataResponse;

use OCA\MultiBoards\Service\MissingDependencyException;
use OCA\MultiBoards\Service\NotFoundException;
use OCP\Files\NotFoundException as FileNotFoundException;
//use OCP\Files\ForbiddenException;
use OCA\MultiBoards\Service\DuplicateEntryException;
use OCA\MultiBoards\Service\WrongParameterException;

trait Errors {

	protected function handleServiceErrors (Closure $callback) {
        try {
			return new DataResponse($callback());
		
        } catch(MissingDependencyException $e) {			
			// $message = ['message' => $e->getMessage()];
			$message = ['message' => "Error: Dependant App Not Installed"];
			return new DataResponse($message, Http::STATUS_NOT_IMPLEMENTED);

        } catch(NotFoundException $e) {			
			// $message = ['message' => $e->getMessage()];
			$message = ['message' => "Error: Not Found"];
			return new DataResponse($message, Http::STATUS_NOT_FOUND);

        } catch(FileNotFoundException $e) {			
			// $message = ['message' => $e->getMessage()];
			$message = ['message' => "Error: Not Found"];
			return new DataResponse($message, Http::STATUS_NOT_FOUND);

        } catch(DuplicateEntryException $e) {			
			$message = ['message' => $e->getMessage()];
			//$message = ['message' => "Error: Duplicate"];
			return new DataResponse($message, Http::STATUS_CONFLICT);

        } catch(WrongParameterException $e) {			
			$message = ['message' => $e->getMessage()];
			//$message = ['message' => "Error: Bad Request"];
			return new DataResponse($message, HTTP::STATUS_BAD_REQUEST);		
		
        } catch(\Exception $e) { // "\Exception" = ANY TYPE OF Exception					
			$message = ['message' => "Error: Other", 'type' => get_class($e)];
			if ($e->getMessage()) {
				$message = ['message' => $e->getMessage(), 'type' => get_class($e)];
			}
			return new DataResponse($message, Http::STATUS_INTERNAL_SERVER_ERROR);
        }
    }
	
	// ToDo: Handle other Errors as well..
		// OCP\Share\Exceptions\ShareNotFound
		// {"message":"You are not allowed to share .PAD31.md","type":"OCP\\Share\\Exceptions\\GenericShareException"}

}