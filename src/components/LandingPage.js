'use strict';

import React, { Component } from 'react';
import { View, Text, StyleSheet, MapView, TextInput, TouchableWithoutFeedback } from 'react-native';
import { Button } from './common';
import  AddNodeForm  from './AddNodeForm';

export default class LandingPage extends Component {

  constructor(props) {
    super(props);
    this.state = {
      currentPosition: { timestamp: 0, coords: { latitude: 1, longitude: 1 } },
      showAddNodeModal: false,
      annotations: []
    };

    this.onButtonPress = this.onButtonPress.bind(this);
    this.onSubmitNode = this.onSubmitNode.bind(this);
    this.onCancelSubmitNode = this.onCancelSubmitNode.bind(this);
    this.onMapLongPress = this.onMapLongPress.bind(this);
  }

  componentDidMount() {
    this.updateCurrentPosition();
  }

  onButtonPress() {
    this.setState({showAddNodeModal: true})
  }

  onAddNodeButtonPress() {
    console.log("LEAVING A PACKAGE AT X: ", this.state.annotations[0].longitude);
    console.log("LEAVING A PACKAGE AT Y: ", this.state.annotations[0].latitude);
  }

  onSubmitNode() {
    // submit 
    console.log("submitted")
    this.setState({ showAddNodeModal: false });
  }

  onCancelSubmitNode() {
    this.setState({ showAddNodeModal: false });
  }

  updateCurrentPosition() {
    let options = {
      enableHighAccuracy: true,
      timeout: 5000,
      maximumAge: 1
    };

    navigator.geolocation.getCurrentPosition(
      (position) => this.setState({ currentPosition: position })
      , null, options);
  }

  onMapLongPress(event) {
    if (!this.state.annotations.length) {
      let options = {
        enableHighAccuracy: true,
        timeout: 5000,
        maximumAge: 1
      };

      navigator.geolocation.getCurrentPosition(
        (position) => {
          this.setState({
              annotations: [this.createAnnotation(position.coords.longitude, position.coords.latitude)]
            })
        }
        , null, options);
    }
  }

  createAnnotation(longitude, latitude) {
    return {
      longitude,
      latitude,
      draggable: true,
      onDragStateChange: (event) => {
        if (event.state === 'idle') {
          this.setState({
            annotations: [this.createAnnotation(event.longitude, event.latitude)]
          });
        }
      },
    };
  }

  renderLeavePackageButton() {
    if (this.state.annotations.length) {
      return (
        <Button onPress={this.onAddNodeButtonPress.bind(this)}>
        Leave a package at the current pin
        </Button>
        )
    }
  }

  render() {
    const position = this.state.currentPosition;
    const annotations = this.state.annotations;

    return (
      <View>
        <TouchableWithoutFeedback onLongPress={ this.onMapLongPress }>
          <MapView
            style={{height: 400, width: 400, margin: 0}}
            showsUserLocation={true}
            region={{latitude: position.coords.latitude, longitude: position.coords.longitude, latitudeDelta: .01, longitudeDelta: .01}}
            annotations={ annotations }
          />
        </TouchableWithoutFeedback>

        <Button onPress={this.onButtonPress.bind(this)}>
        See an example modal
        </Button>
        
        {this.renderLeavePackageButton()}

        <AddNodeForm
          visible={ this.state.showAddNodeModal }
          onSubmitNode={ this.onSubmitNode }
          onCancelSubmitNode={ this.onCancelSubmitNode }
        >
          HAHAHAHA
        </AddNodeForm>
        

      </View>
    );
  }
}

const styles = StyleSheet.create({
  title: {
    fontWeight: '500',
  },
});
