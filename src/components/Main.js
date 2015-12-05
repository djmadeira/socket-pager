/*eslint no-console: 0*/
require('normalize.css');
require('styles/App.scss');
require('styles/webfonts.css');

import React from 'react';
import io from 'socket.io-client';

class DialKey extends React.Component {
    handleClick() {
        this.props.socket.emit('send-digit', this.props.value);
    }

    render() {
        return (
            <button onClick={this.handleClick.bind(this)} className="dial-key">{this.props.value}</button>
        );
    }
}

class DialPad extends React.Component {
    render() {
        let keys = [];
        for (let i=1; i < 10; i++) {
             keys.push(<DialKey key={i} value={i} socket={this.props.socket} />);
        }
        keys.push(<DialKey key={0} value={0} socket={this.props.socket} />);
        return (
             <div className="dial-pad">
                 {keys}
             </div>
        );
    }
}

class PagerDigit extends React.Component {
    render() {
        return <span className="pager-digit">{this.props.value}</span>;
    }
}

class PagerDisplay extends React.Component {
    constructor(props) {
        super()
        this.state = {
            digits: []
        };

        for(var i=0; i < 10; i++) {
            this.state.digits.push(0);
        }

        props.socket.on('receive-digit', function(digit) {
            this.state.digits.shift();
            this.state.digits.push(digit);
            this.forceUpdate();
        }.bind(this));
    }

    render() {
        let digits = [];
        for (let i=0; i < 10; i++) {
             digits.push(<PagerDigit key={i} value={this.state.digits[i]} />);
        }
        return (
            <div className="pager-display">
                {digits}
            </div>
        );
    }
}

class ConnectionStatus extends React.Component {
    constructor(props) {
        super()
        this.state = {
            isConnected: false,
            isActive: false
        };

        props.socket.on('connect', function() {
            this.state.isConnected = true;
            this.forceUpdate();
        }.bind(this));

        props.socket.on('disconnect', function() {
            this.state.isConnected = false;
            this.forceUpdate();
        }.bind(this));

        props.socket.on('buddy-disconnected', function() {
            this.state.isActive = false;
            this.forceUpdate();
        }.bind(this));

        props.socket.on('buddy-connected', function() {
            this.state.isActive = true;
            this.forceUpdate();
        }.bind(this));
    }

    render() {
        let innerText = '';
        if (this.state.isActive) {
            innerText = 'Connected to buddy.';
        } else if (this.state.isConnected) {
            innerText = 'Connected. Waiting for buddy...';
        } else {
            innerText = 'Connecting...';
        }

        return <div className="connection-status">{innerText}</div>
    }
}

class AppComponent extends React.Component {
    constructor() {
        super();

        let socket = io();

        this.state = {
            socket
        };
    }
    render() {
        return (
            <div className="app">
                <ConnectionStatus socket={this.state.socket} />
                <PagerDisplay socket={this.state.socket} />
                <DialPad socket={this.state.socket} />
            </div>
        );
    }
}

export default AppComponent;
