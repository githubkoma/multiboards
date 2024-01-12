import React, { Component } from 'react'
import Markdown from 'react-markdown'
import remarkGfm from 'remark-gfm' // Github flavored Markdown
import rehypeExternalLinks from 'rehype-external-links' // as this didnt work: https://github.com/remarkjs/react-markdown/pull/761#issuecomment-1691801892

class MarkDownComponent extends Component {
  constructor(props) {
    super(props); // e.g. this.props.selected
    //console.log("props:", props);

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
  render() {
    //<div style={{...pStyle, color: "red"}}>    

    // MARKDOWN:
    // https://react.dev/reference/react-dom/components/textarea    
    return (      
      <>      
        <div class="markDownComponent">
          <Markdown className="nowheel" remarkPlugins={[remarkGfm]} rehypePlugins={[[rehypeExternalLinks, { target: '_blank' }]]}
            components={{img(props){const {node, ...rest} = props; return <img style={{width: '100%'}} {...rest} /> }}} // https://github.com/remarkjs/react-markdown#appendix-b-components
          >{this.props.md}</Markdown>                                        
        </div>
      </>
    )
  }
}

export default MarkDownComponent
