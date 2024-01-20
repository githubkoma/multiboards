import React, { Component } from 'react'
import Markdown from 'react-markdown'
import remarkGfm from 'remark-gfm' // Github flavored Markdown
import rehypeExternalLinks from 'rehype-external-links' // as this didnt work: https://github.com/remarkjs/react-markdown/pull/761#issuecomment-1691801892

class MarkDownComponent extends Component {
  constructor(props) {
    super(props); // e.g. this.props.selected
    console.log("props:", props);

    // REACTIVE PROPERTIES:
    // ---
    this.state = { 
      //syncStore: store, // only this can be changed directly, without setState()
      md: props.md,
    };
  }

  // CLASS PROPERTIES
  // ---  

  // LIFECYCLE METHODS
  // ---
  componentWillMount() {
    console.log("Mounted:", "MarkDownComponent");
    /*
    fetch(README)
      .then((res) => res.text())
      .then((md) => {
        this.setState({ md })
      })
    */   
  }

  // CLASS METHODS:
  // ---

  buildImgUrl(src) {    
    // try to get img-files with relative path, e.g. <img src=".attachments.1039/Screenshot%20from%202024-01-20%2010-57-33.jpg">
    if ( this.props.fileInfo && window.OC.currentUser // only logged in user has this webdav scheme
        && (!src.includes("http") && !src.includes("https"))) { // assume absolute path when httpS is missing
      let webDavFilePath = this.props.fileInfo.filePath.replace(this.props.fileInfo.fileName, ''); // before: "/admin/files/1 b/peter.mboard" after: "/admin/1 b/"    
      webDavFilePath = webDavFilePath.replace(/\/files\//, '/'); // before: "/admin/files/1 b/peter.mboard" after: "/admin/1 b/peter.mboard"    
      webDavFilePath += src;
      webDavFilePath = window.OC.getProtocol() + "://" + window.OC.getHost() + window.OC.getRootPath()+ "/remote.php/dav/files" + webDavFilePath
      return webDavFilePath;
    } // absolute img paths stay untouched
    return src;
  }

  render() {
    //<div style={{...pStyle, color: "red"}}>    

    var $that = this;  
    // MARKDOWN:
    // https://react.dev/reference/react-dom/components/textarea      
    return (      
      <>      
        <div class="markDownComponent">
          <Markdown className="nowheel" remarkPlugins={[remarkGfm]} rehypePlugins={[[rehypeExternalLinks, { target: '_blank' }]]}
            components={{img(props){const {node, src, ...rest} = props; return <img style={{width: '100%'}} src={$that.buildImgUrl(src)} {...rest} /> }}} // https://github.com/remarkjs/react-markdown#appendix-b-components
          >{this.props.md}</Markdown>                                        
        </div>
      </>
    )
  }
}

export default MarkDownComponent
