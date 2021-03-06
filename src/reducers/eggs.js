import axios from 'axios';
import _ from 'lodash';
import { tunnelIP } from '../TUNNELIP';

/* --------------    ACTION CONSTANTS    ---------------- */

const ADD_EGG = 'ADD_EGG';
const NEW_EGG = 'NEW_EGG';
const SELECT_EGG = 'SELECT_EGG';
const FETCH_EGGS = 'FETCH_EGGS';
const DELETE_EGG = 'DELETE_EGG';
const PICKUP_EGG = 'PICKUP_EGG';

/* --------------    ACTION CREATORS    ----------------- */

const selectEgg = eggId => ({ type: SELECT_EGG, eggId });
const fetchEggs = eggs => ({ type: FETCH_EGGS, eggs });
const deleteEggFromState = egg => ({ type: DELETE_EGG, egg });
const pickupThisEgg = egg => ({ type: PICKUP_EGG, egg});
const addEggToStore = egg => ({ type: ADD_EGG, egg});
const registerNewEgg = egg => ({ type: NEW_EGG, egg});

/* ------------------    REDUCER    --------------------- */

const initialState = {
  allEggs: {},
  selectedEgg: -1,
};

export default function (state = initialState, action) {
  let newState = Object.assign({}, state);
  switch (action.type) {
    case ADD_EGG:
      newState.allEggs[action.egg.id] = action.egg;
      break;
    case SELECT_EGG:
      newState.selectedEgg = action.eggId;
      break;
    case FETCH_EGGS:
      action.eggs.forEach((egg) => {
        newState.allEggs[egg.id] = egg;
      });
      break;
    case DELETE_EGG:
      newState = _.omit(newState, action.egg.id);
      break;
    case PICKUP_EGG:
      newState.allEggs[action.egg.id].pickedUp = true;
      break;
    case NEW_EGG:
      newState.allEggs[action.egg.id].newEgg = false;
      break;
    default:
      return state;
  }
  return newState;
}

/* --------------    THUNKS/DISPATCHERS    -------------- */
export const setSelectedEgg = eggId =>
  (dispatch) => {
    dispatch(selectEgg(eggId));
  };


export const addEggToDbAndStore = egg =>
  (dispatch) => {
    axios.post(`${tunnelIP}/api/egg`, egg)
      .then((newEgg) => {
        console.log('heres the new egg', newEgg);
        dispatch(addEggToStore(newEgg.data));
      })
      .catch(err => console.log('addEggToDbAndStore in eggs reducer error', err));
  };

export const fetchAllEggs = userId =>
  (dispatch) => {
    axios.get(`${tunnelIP}/api/egg/user/${userId}`)
    .then(res => dispatch(fetchEggs(res.data)))
    .catch(err => console.error('Problem fetching eggs', err.message));
  };

export const deleteEgg = egg =>
  (dispatch) => {
    axios.put(`${tunnelIP}/api/egg/${egg.id}`, egg)
      .then(res => dispatch(deleteEggFromState(egg)))
      .catch(err => console.log('problem deleting egg', err));
  };

export const pickupEgg = egg =>
  (dispatch) => {
    axios.put(`${tunnelIP}/api/egg/${egg.id}`, egg)
      .then(() => dispatch(pickupThisEgg(egg)))
      .catch(err => console.log('problem picking up egg', err));
  };

export const makeOldEgg = egg => dispatch => {
    axios.put(`${tunnelIP}/api/egg/${egg.id}`, egg)
      .then(() => dispatch(registerNewEgg(egg)))
      .catch(err => console.log('problem making old egg', err));
}
