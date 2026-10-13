import React from 'react'
import ReactDOM from 'react-dom'
import Modal from '/subject/packages/material-ui/src/Modal'
import Fade from '/subject/packages/material-ui/src/Fade'

class App extends React.Component {
  state = { anchorEl: null }
  run = () => this.setState({ anchorEl: document.body }, () => {
    this.setState({ anchorEl: null }, () => this.setState({ anchorEl: document.body }))
  })
  render () {
    const { anchorEl } = this.state
    return <main><span id="oracle-ready" />
      <h1>Modal container switch</h1><button onClick={this.run}>Run container switch</button>
      <Modal open={Boolean(anchorEl)} container={anchorEl}>
        <Fade in={Boolean(anchorEl)}><div style={{background:'white',padding:24}}>Hello from modal</div></Fade>
      </Modal>
    </main>
  }
}
ReactDOM.render(<App />, document.getElementById('app'))
