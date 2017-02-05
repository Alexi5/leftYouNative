import React, { Component } from 'react';
import { connect } from 'react-redux';
import { Actions } from 'react-native-router-flux';
import { View, Text, TouchableOpacity, MapView } from 'react-native';
import { Card, CardSection } from './common';
import { setSelectedEgg, deleteEgg } from '../reducers/eggs';
import EggManagerModal from './EggManagerModal';

class EggManager extends Component { 
  constructor(props) {
    super(props);
    this.state = {
      showModal: false,
      selectedFriendId: -1,
      displayedEggIds: [],
      filterBy: 'all',
      chosenEgg: {}
    };
  }

  componentWillMount() {
    let displayedEggIds = [];
    // apply filters and set filtered egg IDs on local state
    switch (this.state.filterBy) {
      case 'all':
        Object.keys(this.props.allEggs).map(eggId => {
          let egg = this.props.allEggs[eggId];
          if (egg.senderId == this.props.selectedFriendId && !egg.deletedByReceiver) {
            displayedEggIds.push(eggId);
          }
          if (egg.receiverId == this.props.selectedFriendId && !egg.deletedBySender) {
            displayedEggIds.push(eggId);
          }
        });
        break;
      case 'sent':
        Object.keys(this.props.allEggs).map(eggId => {
          let egg = this.props.allEggs[eggId];
          if (egg.receiverId == this.props.selectedFriendId && !egg.deletedBySender) {
            displayedEggIds.push(eggId);
          }
        });
        break;
      case 'received':
        Object.keys(this.props.allEggs).map(eggId => {
          let egg = this.props.allEggs[eggId];
          if (egg.senderId == this.props.selectedFriendId && !egg.deletedByReceiver) {
            displayedEggIds.push(eggId);
          }
        });
        break;
      default:
        return;          
    };
    this.setState({selectedFriendId: this.props.selectedFriendId, displayedEggIds});
  }

  onEggPress(egg) {
    this.setState({showModal: true, chosenEgg: this.props.allEggs[egg.id] });
  }

  onDelete() {
    // our delete function is a little weird and an antipattern I think
    // because we don't want to delete eggs from the database
    // so we're actually UPDATING the egg to SAY it's been deleted,
    // and by whom.
    if (this.state.chosenEgg.senderId === this.state.selectedFriendId) {
      this.state.chosenEgg.deletedByReceiver = true;
    } else {
      this.state.chosenEgg.deletedBySender = true;
    }

    this.props.deleteEgg(this.state.chosenEgg);
    this.setState({chosenEgg: {}});
  }

  onCancel() {
    this.setState({showModal: false});
  }

  renderPayload(egg) {
    if (!egg.payload) {return};
    let payloadType = egg.payload.type;
    
    switch (payloadType) {
      case 'Text':
        return (<Text> { egg.payload.text } </Text>)
      case 'Image':
        return (<View> { egg.payload.path } } </View>);
      default:
        return (<Text> Something has GONE WRONG </Text>);
    }
  }


  renderEggCard(egg) {
    let displayDate = new Date(Date.parse(egg.createdAt)).toString().split(" ").slice(0,4).join(" ");
    let displayColor = (egg.pickedUp) ? "blue" : "red";
    return (
      <TouchableOpacity 
        key={egg.id} 
        onLongPress={() => this.onEggPress(egg)}
        style={{backgroundColor: displayColor}}
      >
        <Card>
          <CardSection>
            <Text> GO HERE: {egg.goHereText} </Text>
          </CardSection>
          <CardSection>
            <Text> FROM: {egg.senderId} </Text>
          </CardSection>
          <CardSection>
            <Text> PAYLOAD: {egg.payload.text} </Text>
          </CardSection>
          <CardSection>
            <Text> CREATED ON: {displayDate} </Text>
          </CardSection>
        </Card>
      </TouchableOpacity>
      )
  }

  render() {
    const { container, text } = styles;
    return (
      <View style={container}>
        {this.state.displayedEggIds.map(eggId => {
          let egg = this.props.allEggs[eggId];
          return this.renderEggCard(egg);
        })}
        <EggManagerModal
            visible={this.state.showModal}
            chosenEgg={this.state.chosenEgg}
            onDelete={this.onDelete.bind(this)}
            onCancel={this.onCancel.bind(this)}
            >
            
            <MapView
            style={{height: 250, width: 250, margin: 0}}
            showsUserLocation={false}
            region={{latitude: this.state.chosenEgg.latitude, longitude: this.state.chosenEgg.longitude, latitudeDelta: .01, longitudeDelta: .01}}
              annotations={[{
                longitude: this.state.chosenEgg.longitude,
                latitude: this.state.chosenEgg.latitude,
                tintColor: MapView.PinColors.PURPLE,
                draggable: false 
              }]}
            />
            {this.renderPayload(this.state.chosenEgg)}
          
        </EggManagerModal>
      </View>
    );
  };
};

const styles = {
  container: {
    flex: 1,
    backgroundColor: '#f4f281',
    justifyContent: 'center',
  },
  text: {
    textAlign: 'center',
    fontSize: 25,
    color: '#fff',
    fontWeight: '600',
  }
};

const mapStateToProps = (state, ownProps) => { 
  const allEggs = state.eggs.allEggs;
  const selectedFriendId = state.friends.selectedFriendId;
  return { allEggs, selectedFriendId }; 
};

const mapDispatchToProps = (dispatch, ownProps) => {
  return {
    setSelectedEgg: function(eggId) {
      dispatch(setSelectedEgg(eggId));
      },
    deleteEgg: function(egg) {
      dispatch(deleteEgg(egg));
    }
  };
};

export default connect(mapStateToProps, mapDispatchToProps)(EggManager);