// 
// Thanks to: https://github.com/jgraph/drawio-nextcloud/blob/main/src/main.js
//   regarding https://docs.nextcloud.com/server/latest/developer_manual/app_publishing_maintenance/app_upgrade_guide/upgrade_to_28.html
//

import { DefaultType, FileAction, addNewFileMenuEntry, registerFileAction,
	File, Permission, getNavigation } from '@nextcloud/files'

if (OC.config.version.substring(0,2) >= 28) {

    const Mimes = {
        'mboard': { 'mime': 'application/x-mboard', 'type': 'text', 'css': 'icon-mboard',
            'icon': '',
            'newStr': 'New Multiboard' }        
    };

	function registerAction(ext, attr)
	{
		registerFileAction(new FileAction({
			id: 'mboard',
			displayName() {
				'Open in MultiBoards'
			},
			enabled(nodes) {
				return nodes.length === 1 && attr.mime === nodes[0].mime && (nodes[0].permissions & OC.PERMISSION_READ) !== 0
			},
			iconSvgInline: () => attr.icon,
			async exec(node, view) {
				//console.log(node, view);
				//console.log(node.fileid, node.token);
				
				if (!window.OC.getCurrentUser().uid) {
					alert("Not yet implemented.");
				} else {					
					var fileId = node.fileid;        
					var url = OC.generateUrl('/apps/' + 'multiboards' + '/?fileId=' + fileId); // + '&dir=' + context.dir + '&fileName=' + fileName);                
					window.location.href = url;   
				}

			},
			default: DefaultType.HIDDEN
		}));
	}

	function addMenuEntry(ext, attr)
	{
		addNewFileMenuEntry({
			id: 'mboard',
			displayName: attr.newStr,
			enabled() {
				// only attach to main file list, public view is not supported yet
				return getNavigation()?.active?.id === 'files'
			},
			iconClass: attr.css,
			async handler(file, folder)
			{
				//const contentNames = content.map((node) => node.basename);
				//const fileName = getUniqueName(attr.newStr, ext, contentNames);
				//console.log(file, folder.source, ext, attr);
				//console.log(file.root, file.path, file.name);

				if (!window.OC.getCurrentUser().uid) {
					alert("Not yet implemented.");
				} else {
					var webDavUrl = window.OC.getProtocol() + "://" + window.OC.getHost() + window.OC.getRootPath()+ "/remote.php/dav/" + file.root + file.path + "/" + "MultiBoard " + new Date(Date.now()).toUTCString().substring(5) + ".mboard";        
					$.ajax({
						url: webDavUrl, 
						method: 'PUT', 
						headers: {"requesttoken": window.oc_requesttoken}, 
						data: '{ "nodes": [], "edges": [] }', 
						contentType: "application/x-mboard",
						success: function (data) {          							
							location.reload();
						},
						error: function (e) {
							window.OC.dialogs.message("Error", "Not Created") 
						}
					})
				}
			}
		});
	}
	
	for (const ext in Mimes) 
	{
		//console.log(ext, Mimes);
		registerAction(ext, Mimes[ext]);
		addMenuEntry(ext, Mimes[ext]);
	}	
}

///
// Thanks to: https://github.com/kirstenhh/nc-bpm-app/
//

if (OC.config.version.substring(0,2) < 28) {

	// FileList, Newfile, Private & Public:
	const MultiBoardsFileMenuPlugin = {
		attach: function (menu) {
			menu.addMenuEntry({
				id: 'mboard',
				displayName: t('multiboards', 'New Multiboard'),
				templateName: 'New.mboard',
				iconClass: 'icon-filetype-file',
				fileType: 'file',
				actionHandler(fileName, context) {
					console.debug('---------- file action triggered', menu)
					const fileList = menu.fileList;
					const file = {
						name: fileName,
						path: fileList.getCurrentDirectory(),
						permissions: OC.PERMISSION_CREATE | OC.PERMISSION_UPDATE,
					};

					console.log(file);

					if (!window.OC.getCurrentUser().uid) {
						alert("Not yet implemented.");
					} else {
						var webDavUrl = window.OC.getProtocol() + "://" + window.OC.getHost() + window.OC.getRootPath()+ "/remote.php/dav/files/" + window.OC.getCurrentUser().uid + file.path + "/" + file.name;        
						$.ajax({
							url: webDavUrl, 
							method: 'PUT', 
							headers: {"requesttoken": window.oc_requesttoken}, 
							data: '{ "nodes": [], "edges": [] }', 
							contentType: "application/x-mboard",
							success: function (data) {          
								console.log(data);
								location.reload();
							},
							error: function (e) {
								window.OC.dialogs.message("Error", "Not Created") 
							}
						})
					}
				},
			});

		},
	};
	OC.Plugins.register('OCA.Files.NewFileMenu', MultiBoardsFileMenuPlugin);

	// FileList, Private & Public
	const MultiBoardsFileListPlugin = {
		ignoreLists: [
			'trashbin',
		],

		attach(fileList) {
			//registerFileIcon();

			if (this.ignoreLists.includes(fileList.id)) {
				return;
			}

			fileList.fileActions.setDefault('application/x-mboard', 'mboard');

			fileList.fileActions.registerAction({
				name: 'mboard',
				displayName: t('multiboards', 'MultiBoard'),
				mime: 'application/x-mboard',
				//icon: OC.imagePath('files_bpm', 'icon-filetypes_dmn.svg'),
				iconClass: 'icon-filetype-file',
				permissions: OC.PERMISSION_READ,
				actionHandler(fileName, context) {

					if (!window.OC.getCurrentUser().uid) {
						alert("Not yet implemented.");
					} else {
						const file = context.fileList.elementToFile(context.$file);
						var fileId = file.id || context.fileList.getModelForFile(fileName).id;        
						var url = OC.generateUrl('/apps/' + 'multiboards' + '/?fileId=' + fileId); // + '&dir=' + context.dir + '&fileName=' + fileName);                
						window.location.href = url;   
					}
				},
			});

			fileList.fileActions.setDefault('application/x-mboard', 'mboard');
		},
	};
	OC.Plugins.register('OCA.Files.FileList', MultiBoardsFileListPlugin);

}

// Single Fileshare Template:
function bootstrapFileShare() {	
	if (!OCA?.Sharing?.PublicApp) { // This is only available early when used addScript() instead of addInitScript() in Application.php -> NcEventListener.php
		return;
	}

	// import { loadState } from '@nextcloud/initial-state';
	// see NcEventListener.php ... $this->initialState->provideInitialState('share', [
	// const state = loadState<{ permissions: number, nodeType: string, nodeId: number }>('multiboards', 'share');
	const mimetype = $('#mimetype').val();
	let state = JSON.parse(atob($("#initial-state-multiboards-share").val()));
	
	//if (['application/x-mboard'].includes(mimetype)) {
	if (['application/x-mboard'].includes(mimetype) && state?.nodeType === 'file') {
		
		const filename = $('#filename').val();
		const file = {
			name: filename,
			path: '/',
			permissions: state.permissions,
			id: state.nodeId,			
			shareToken: state.shareToken,	
			fullId: state.fullId,		
		};

		const fileList = {
			setViewerMode: () => undefined,
			showMask: () => undefined,
			hideMask: () => undefined,
			reload: () => Promise.resolve(),
			getDirectoryPermissions: () => 0,
			findFile: () => file,
		};

		console.log(file, fileList);		

		var url = OC.generateUrl('/apps/' + 'multiboards' + '/?shareToken=' + file.shareToken); // + '&dir=' + file.path + '&fileName=' + file.name);
		window.location.href = url;   

	}		
	
};
bootstrapFileShare();