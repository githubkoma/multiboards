<?php
/**
 * Create your routes in here. The name is the lowercase name of the controller
 * without the controller part, the stuff after the hash is the method.
 * e.g. page#index -> OCA\BasicSkeleton\Controller\PageController->index()
 *
 * The controller class has to be registered in the application.php file since
 * it's instantiated in there
 */
return [
    'routes' => [
	   ['name' => 'page#index', 'url' => '/', 'verb' => 'GET'],
	   ['name' => 'file#get_file_info', 'url' => '/file/info', 'verb' => 'GET'],
       ['name' => 'file#save_file', 'url' => '/file/save', 'verb' => 'PUT'],
       ['name' => 'file#load_media_file', 'url' => '/file/load', 'verb' => 'GET'],
       ['name' => 'file#load_pdf_preview', 'url' => '/file/pdfPreview', 'verb' => 'GET'],
    ]
];
