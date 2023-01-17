import logo from './logo.svg';
import './App.css';

import firebase, { initializeApp } from 'firebase/compat/app';
import 'firebase/compat/firestore';
import 'firebase/compat/auth';
import 'react-router-dom'
import { BrowserRouter, Routes, Route, useParams, createRoutesFromChildren } from 'react-router-dom'
import { useNavigate } from "react-router-dom";
import React, { useEffect, useState } from 'react';

import { useAuthState } from 'react-firebase-hooks/auth';
import { useCollectionData } from 'react-firebase-hooks/firestore';
import { collectionGroup, query, where, getDocs, updateDoc, arrayUnion, doc, getFirestore, getDoc, increment } from "firebase/firestore";  
import { answers } from './answers';
import { wordlist } from './words';
import {Game} from './Game'
// const readline = require('readline');
// const {EOL} = require('os')

const firebaseConfig = {
  apiKey: "AIzaSyBXDy67j_4tfZfKwnDVJtcNmvoWAiyhO5Q",
  authDomain: "word-guesser-7f2bd.firebaseapp.com",
  projectId: "word-guesser-7f2bd",
  storageBucket: "word-guesser-7f2bd.appspot.com",
  messagingSenderId: "152067087499",
  appId: "1:152067087499:web:8da10af4022fd87aa3888e",
  measurementId: "G-QPRBY81WP9"
};

const app = firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const firestore = firebase.firestore();


function App() {
  const [user] = useAuthState(auth);
  let inGame = false;
  return (
    <>
    <div className="app">
      <header className="App-header">
        <h1>Word Guesser</h1>
      </header>
      <section>
        {user ? <AuthedApp /> : <SignIn />}
      </section>
    </div>
    
    </>
  );
}

function AuthedApp() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Lobby/>}/>
        <Route path="/game/:id" element={<Game/>}/>
      </Routes>
    </BrowserRouter>

  )
}
function SignIn() {
  const signInWithGoogle = () => {
    const provider = new firebase.auth.GoogleAuthProvider();
    auth.signInWithPopup(provider);
  }

  return (
    <>
    <button className = "sign-in" onClick={signInWithGoogle}>Sign in with Google to play</button>
    </>
  )
}
function SignOut() {
  return (
    <button className="sign-out" onClick={() => auth.signOut()}>Sign Out</button>
  )
}

function Lobby() {
  const navigate = useNavigate();
  const { user } = useAuthState(auth);
  const { uid } = auth.currentUser;
  const [value, setValue] = React.useState("");
  const [name, setName] = React.useState("");
  const [room, setRoom] = React.useState(null);
  const prefix = "/game/"
  const roomsCollection = firestore.collection('rooms');
  const onChange = async (e) => {
    setValue(e.target.value)
    console.log(value)
  }
  const onNameChange = async (e) => {
    setName(e.target.value)
    console.log(name)
  }
  const createNewRoom = async () => {
    const docref = await roomsCollection.add({
      users: [{user: uid, points: 0, username: name, username: name}],
      writer: uid,
      // word: null,
      guesses: [],
      clues: [],
      word: ""
    })
    console.log("create");
    navigate("/game/"+docref.id)
  }
  const joinRoom = async () => {
    const getRoom = async() => {
      let roomref = roomsCollection.doc(value)
      const roomSnap = await getDoc(roomref)
      setRoom(roomSnap)
    }
    await getRoom();
    console.log(room)
    if(!room || !room.exists) {
      console.log("no room");

    }else {
      console.log("join");
      await updateDoc(roomsCollection.doc(room.id), {users: arrayUnion({user: uid, points: 0, username: name})})
      navigate("/game/"+room.id);
    }
  }
  return (
    <div>
    <header className="App-header">
      <h1>Lobby</h1>
      <SignOut />
    </header>
    <section>
      <div>
      <input
        type="text"
        name="username"
        onChange={onNameChange}
        placeholder="Display Name"
        value={name}
        />
      </div>
      <div>
        <button className = "create-room" onClick={createNewRoom}>Create a room</button>
        <br/>
      </div>
      <div>
        <input
        type="text"
        name="room_id"
        onChange={onChange}
        placeholder="Room ID"
        value={value}
        />
        <br/>
        <button onClick={joinRoom}>Join</button>
      </div>
      
    </section>
    
    </div>
  )
}


export default App;
