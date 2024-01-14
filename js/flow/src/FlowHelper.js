import $ from 'jquery';

class FlowHelper {
  constructor() {
    // not used, this class shall be static (new FlowHelper() isnt used)
  }  

  static dotdotAfterN($string, $numCharacters)  {	
    let $finalString = "";
    if ($string && (typeof $string === 'string')) {
        if ($string.length > $numCharacters) {	
            $finalString = $string.substring(0, $numCharacters) + '..';
        } else {
            $finalString = $string;
        }
        } else {
        $finalString = "";
      }	
      return $finalString;      
  }

  static mapFlowSyntaxToFileSyntax(nodes, edges) {    
    var tmpNodesArray = [];
    var tmpEdgesArray = [];    
    // NODES:
    Object.values(nodes).forEach(element => {
      element = JSON.parse(element);      
      let fileSyntaxNode = {            
        type: element.type,
        id: element.id,        
        x: element.position.x,
        y: element.position.y,
        width: element.style.width,
        height: element.style.height,               
      }
      switch (element.type) {
        case "text":
          fileSyntaxNode.text = element.data.text;
          break;      
        case "file":          
          fileSyntaxNode.fileId = element.data.fileId;          
          //fileSyntaxNode.file = ""; // Relative Filepath like in Obsidian doesnt work          
          fileSyntaxNode.ncShareToken = element.data.ncShareToken;
          fileSyntaxNode.subpath = element.data.subpath;
          break;
      }
      tmpNodesArray.push(fileSyntaxNode);
    });
    // EDGES:
    Object.values(edges).forEach(element => {
      element = JSON.parse(element);      
      let fileSyntaxEdge = {                    
        id: element.id,    
        //type: element.type, // only 1 type!   
        fromNode: element.source,
        toNode: element.target,
        fromSide: "bottom",
        toSide: "top",                    
      }
      if (element.data.label && (element.data.label.trim() !== "")) {
        fileSyntaxEdge.label = element.data.label;
      }
      tmpEdgesArray.push(fileSyntaxEdge);
    });
    var fileContent = { "nodes": [], "edges": [] };
    fileContent.nodes = tmpNodesArray;
    fileContent.edges = tmpEdgesArray;
    console.log("Mapped to FileSyntax:", fileContent);
    return fileContent;
  }

  static mapFileSyntaxToFlowSyntax(fileContent) {   
    var tmpNodesArray = [];
    var tmpEdgesArray = [];
    console.log("Mapping to FlowSyntax:", fileContent.nodes, fileContent.edges); 
    // NODES: 
    Object.values(fileContent.nodes).forEach(element => {                
      const nodeStyle = { border: "1px solid", color: "white", height: element.height, width: element.width, "background-color": "#1E1E1E", "border-radius": "5px", "overflow-y": "auto", "overflow-x": "hidden", };
      nodeStyle.width = element.width;
      nodeStyle.height = element.height;
      var flowNode = {
        type: element.type,
        id: element.id,        
        position: { x: element.x, y: element.y},        
        style: nodeStyle, 
      }
      switch (element.type) {
        case "text":
          flowNode.data = { text: element.text };
          break;      
        case "file":
          flowNode.data = { fileId: element.fileId };          
          break;
        default: 
          flowNode.data = { };          
          break;
      }
      console.log(flowNode);
      flowNode.data.ncShareToken = element.ncShareToken;
      flowNode.data.subpath = element.subpath;
      tmpNodesArray.push(flowNode);
    });
    // EDGES:
    Object.values(fileContent.edges).forEach(element => {     
      console.log(element);                  
      var flowEdge = {        
        id: element.id,
        type: "floating",
        source: element.fromNode,
        target: element.toNode,   
        data: { label: (element.label) ? element.label : "" },
      }
      tmpEdgesArray.push(flowEdge);
    });
    return [tmpNodesArray, tmpEdgesArray];
  }

  static async getFileInfo(id, shareToken) {
    let url = window.OC.getProtocol() + "://" + window.OC.getHost() + window.OC.getRootPath()+ "/index.php/apps/multiboards/file/info?fileId=" + id + "&shareToken=" + shareToken;    
    var fileInfo = await $.ajax({ url: url, method: 'GET', headers: {"requesttoken": window.oc_requesttoken}, success: function(data) {return data} });     
    return fileInfo;
  }

  static async getFileInfoByPath(filePath) {    
    let url = window.OC.getProtocol() + "://" + window.OC.getHost() + window.OC.getRootPath()+ "/index.php/apps/multiboards/file/info?filePath=" + encodeURIComponent(filePath) + "&fileId=null&shareToken=null";        
    var fileInfo = await $.ajax({ url: url, method: 'GET', headers: {"requesttoken": window.oc_requesttoken}, success: function(data) {return data} });         
    return fileInfo;
  }

}

export default FlowHelper