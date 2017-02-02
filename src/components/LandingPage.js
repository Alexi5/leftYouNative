'use strict';

import React, { Component } from 'react';
import { View, Text, StyleSheet, MapView, TextInput, TouchableWithoutFeedback, Modal, Image } from 'react-native';
import { Button } from './common';
import  AddEgg  from './AddEgg';
import { connect } from 'react-redux';
import axios from 'axios';
import { Actions } from 'react-native-router-flux';
import { setSelectedEgg, fetchAllEggs } from '../reducers/eggs';
import { tunnelIP } from '../TUNNELIP';
import {showModal} from '../reducers/addNodeModal';
import { setAnnotation, clearAnnotation } from '../reducers/map';

class LandingPage extends Component {

  constructor(props) {
    super(props);
    this.state = {
    // user's current position
      currentPosition: { timestamp: 0, coords: { latitude: 1, longitude: 1 } },
    // locations of eggs waiting to be picked up
      pickups: [],
      //demonstrating image rendering on front end
       goHereImage: {},

      pickupRadius: 0.0003
    };

    this.onMapLongPress = this.onMapLongPress.bind(this);
  }

  componentWillMount() {
  // set timer to update "current position" on state every second
    this.timerID = setInterval(
      () => this.checkFences(),
      1000
    );

    // fetch all eggs belonging to the current user
    this.props.fetchAllEggs(this.props.user.id);

      //this sets the sample image on the home page, use this as a template for how to get the axios response you will need to render images.
      let goHereImage2;
      axios.get(`${tunnelIP}/api/egg/goHereImage/19`)
          .then(response => {
              goHereImage2 = response.data
              this.setState({goHereImage: goHereImage2});
          })
  }

  componentWillReceiveProps(nextProps) {
    // loop through all the user's eggs and turn them into map annotations
    let pickups = [];

    for (let key in nextProps.allEggs) {
      let egg = nextProps.allEggs[key];

      if (egg.receiverId === this.props.user.id) {
        let newPickup = this.createStaticAnnotation(egg.longitude, egg.latitude, egg.senderId, egg.id, egg.goHereText);
        pickups.push(newPickup);
      }
    }
    this.setState({ pickups }); 
  }

  isWithinFence(coordinatesObject, egg){
   if(!egg) { return false }  
    
   let eggLong = Number(egg.longitude)
   let eggLat = Number(egg.latitude)

   let fence = Math.pow((coordinatesObject.longitude-eggLong), 2) + Math.pow((coordinatesObject.latitude-eggLat), 2);
   if (fence < Math.pow(this.state.pickupRadius, 2)) {
     return true;
   }

   return false;
  }

  onAddNodeButtonPress() {
    this.props.showModal(true);
  }

  checkFences() {
    this.updateCurrentPosition();
    for (let key in this.props.allEggs) {
      let egg = this.props.allEggs[key];
      if (this.isWithinFence(this.state.currentPosition.coords, egg)) {
        this.props.setSelectedEgg(egg.id);
      }
    }
  };

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
    if (!this.props.annotation.length) {
      let options = {
        enableHighAccuracy: true,
        timeout: 5000,
        maximumAge: 1
      };

      navigator.geolocation.getCurrentPosition(
        (position) => {
          let newA = this.createAnnotation(position.coords.longitude, position.coords.latitude);
          this.props.setAnnotation(newA);
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
          let newAnnotation= this.createAnnotation(event.longitude, event.latitude);
          this.props.setAnnotation(newAnnotation);
        }
      },
    };
  }

  createStaticAnnotation(longitude, latitude, senderId, eggId, goHereText) {
    // we might want to change what's displayed here later, this is just
    // a placeholder example fo the info we can put on pins
    let pinSubtitle = "Egg from user " + senderId;
    return {
      longitude,
      latitude,
      eggId,
      title: goHereText,
      subtitle: pinSubtitle,
      tintColor: MapView.PinColors.PURPLE,
      draggable: false
    };
  };

  renderLeaveEggButton() {
    if (this.props.annotation.length) {
      return (
        <Button onPress={this.onAddNodeButtonPress.bind(this)}>
        Leave an egg at the current pin
        </Button>
        )
    }
  }

  renderPickupEggButton() {
    // if you're within the fence of an egg, render the button
    if (this.isWithinFence(this.state.currentPosition.coords, this.props.allEggs[this.props.selectedEgg])) { 
      return (
        <Button onPress={Actions.viewPayload}>
          FOUND AN EGG! PRESS HERE TO PICK IT UP!
        </Button>
      )
    }
  }

  render() {
    const position = this.state.currentPosition;

    // the annotations on the map are a combination of packages waiting for pickup
    // + new eggs waiting to be dropped (from the AddEgg modal)

    const annotations = this.props.annotation.concat(this.state.pickups);

    // console.log('this.state.currentPosition: ', this.state.currentPosition)

    annotations.map(annotation => {
      if(annotation){
        if(this.isWithinFence(this.state.currentPosition.coords, annotation)){
          annotation.tintColor= MapView.PinColors.GREEN,
          annotation.rightCalloutView = (
            <Button 
              color='#517fa4'
              onPress={Actions.viewPayload} 
              >Psst...
            </Button>
          );    
        }
      }
    })

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
        <Button onPress={Actions.eggManager}> Manage Eggs </Button>
        
        {this.renderLeaveEggButton()}
        {this.renderPickupEggButton()}

          <Image style={{width: 50, height: 50}} source={{uri: this.state.goHereImage.uri}}></Image>

        <Modal
            visible={this.props.showAddNodeModal}
            transparent
            animationType="fade"
            onRequestClose={() => {
            }}
        >
          <AddEgg
              {...this.state}>
          </AddEgg>
        </Modal>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  title: {
    fontWeight: '500',
  },
});

const mapStateToProps = (state, ownProps) => {

  const user = { id: 225 };

  let selectedEgg = state.eggs.selectedEgg;
  let allEggs = state.eggs.allEggs;

  return {
    showAddNodeModal: state.addNodeModal.showAddNodeModal,
    annotation: state.map.annotation,
    selectedEgg,
    allEggs,
    user
  };
};

const mapDispatchToProps = (dispatch, ownProps) => {
  return {
    setSelectedEgg: function(eggId) {
        dispatch(setSelectedEgg(eggId));
      },
    fetchAllEggs: function(userId) {
      dispatch(fetchAllEggs(userId));
    },
    showModal: function(boolean) {
        dispatch(showModal(boolean));
    },
    setAnnotation: function(annotation) {
      dispatch(setAnnotation(annotation));
    },
    clearAnnotation: function() {
      dispatch(clearAnnotation());
    }
  };
};

export default connect(mapStateToProps, mapDispatchToProps)(LandingPage);
