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
//const analytics = firebase.analytics();

const getRandomWord = () => {
  const line = Math.floor(Math.random()*2309);
  return answers[line];
}

// const words = fs.readFileSync('../words.txt')
// const wordlist = words.split(EOL)

const checkWord = (word) => {
  return wordlist.includes(word)
}

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
  const [room, setRoom] = React.useState(null);
  const prefix = "/game/"
  const roomsCollection = firestore.collection('rooms');
  const onChange = async (e) => {
    setValue(e.target.value)
    console.log(value)
  }
  const createNewRoom = async () => {
    const docref = await roomsCollection.add({
      users: [{user: uid, points: 0}],
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
    //const ref = firestore.collection("rooms").doc(value)
    //const docSnap = await getDoc(ref);
    //console.log(docSnap.data)
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
      await updateDoc(roomsCollection.doc(room.id), {users: arrayUnion({user: uid, points: 0})})
      navigate("/game/"+room.id);
      // navigate("/game/")
    }
  }
  return (
    <div>
    <header className="App-header">
      <h1>Lobby</h1>
      <h1>{answers[0]}</h1>
      <SignOut />
    </header>
    <section>
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

function Game() {
  const { user } = useAuthState(auth);
  const {uid} = auth.currentUser;
  const params = useParams();
  console.log("game");
  let room
  const roomsCollection = firestore.collection('rooms');
  const [writer, setWriter] = useState(null)
  const [points, setPoints] = useState(0)
  useEffect(() => {
    const getWriter = async() => {
      let roomref = roomsCollection.doc(params.id)
      room = await getDoc(roomref)
      console.log(room.data())
      console.log(room.get("writer"))
      setWriter(room.get("writer"))
    }
    const getPoints = async() => {
      let roomref = roomsCollection.doc(params.id)
      room = await getDoc(roomref)
      console.log(room.data())
      console.log(room.get("users")[uid])
      setPoints(room.get("users")[uid])
    }
    getWriter();
    getPoints();
    console.log(writer)
  })
  // let writer = getWriter()
  return (
    <>
    <header className="App-header">
      <h1>Game</h1>
      <h2>{params.id}</h2>
      <h2>{uid}</h2>
      <h2>Writer: {writer? writer:"wait"}</h2>
      <h2>Points: {points}</h2>
    </header>
    <section>
      { writer == uid? <Writer roomId={params.id}/> : <Guesser roomId={params.id}/>}
    </section>
    </>
  )
}

function Writer({roomId}) {
  const [word, setWord] = useState(null)
  const [clue, setClue] = useState("")
  const [clues, setClues] = useState([])
  const [newClue, setNewClue] = useState(null)
  const roomsCollection = firestore.collection('rooms');
  const {uid} = auth.currentUser;
  let res;
  //let roomId;
    const getClues = async() => {
      let roomref = roomsCollection.doc(roomId)
      let room = await getDoc(roomref)
      console.log(room.data())
      console.log(room.get("clues"))
      setClues(room.get("clues"))
      console.log(clues)
    }
    const getWord = async() => {
      let roomref = roomsCollection.doc(roomId)
      let room = await getDoc(roomref)
      console.log(room.data())
      console.log(room.get("word"))
      if(room.get("word")) {
        setWord(room.get("word"))
      }
      console.log(word)
    }
    const UpdateWord = async() => {
      console.log("update "+word)
      await updateDoc(roomsCollection.doc(roomId), {'word': word})
    }
  useEffect(() => {
    getWord();
    if(!word) {
      // fetch("https://thatwordleapi.azurewebsites.net/get/")
      // .then(res => res.json())
      // .then(
      //   (res) => {
      //     console.log(res.Response)
      //     setWord(res.Response);
      //     console.log(word)
      //   },
      setWord(getRandomWord())
      
    }
    UpdateWord();
    getClues();
  }, [])
  const onChange = async (e) => {
    setClue(e.target.value)
    UpdateWord();
    getClues();
    getWord();
  }
  const testClue = async () => {
    getClues();
    getWord();
    UpdateWord();
    // console.log(clue+" not valid")
    if(!clue || clue.length != 5) {
      return;
    }
    // let valid;
    // let res;
    
    // fetch("https://thatwordleapi.azurewebsites.net/ask/?word="+clue).then(res => res.json()).then(
    //   res=>{
    //     setValid(res.Response)
    //     console.log(res.Response)
    //   }
    // )
    let isValid = true;
    if(!checkWord(clue)) {
      console.log(clue+" not valid")
      console.log(wordlist.includes(clue))
      isValid = false;
      setValid(false);
    }
    console.log(checkWord(clue))
    console.log(wordlist.includes(clue))
    if(!isValid) {
      return;
    }
    // add clue to room
    //console.log(clue)
    //console.log(roomId)
    await updateDoc(roomsCollection.doc(roomId), {clues: arrayUnion({giver: uid, clue: clue})})
    setNewClue(clue)
    console.log(clue)
  }
  return (
    <div className="writer-container">
      <h1>You word is {word? word:"loading..."}</h1>
      <section>
        {/* <h1>test</h1> */}
        {clues? clues.map(c => <DisplayClue word={word} clue={c.clue}/>): <p>loading</p>} 
        {/* //<DisplayClue word={word} clue={c.clue}/>) : <p>no clues yet</p>} */}
      </section>
      <input
        type="text"
        name="clue"
        onChange={onChange}
        placeholder="Clue"
        value={clue}
        />
        <br/>
        <button onClick={testClue}>Give Clue</button>
    </div>
  )
}
function DisplayClue({word, clue}) {
  // console.log(clue)
  if(!word || !clue) {
    return (
      <div>
        <h1>loading</h1>
      </div>
    )
  }
  //console.log(clue)
  clue = clue.toUpperCase()
  word = word.toUpperCase()
  let freq = Array(26).fill(0);
  for(let i=0; i<5; i++) {
    freq[word.charCodeAt(i)-65]+=1
    //console.log(word.charAt(i)-65)
  }
  //console.log(freq)
  let format = Array(5)//.fill(0);
  for(let i=0; i< clue.length; i++) {
    if(clue[i]==word[i]){
      format[i]=<div className="green"><p >{clue[i]}</p></div>//2;
      freq[clue.charCodeAt(i)-65]--;
    } else if(freq[clue.charCodeAt(i)-65]>0) {
      format[i]=<div className="yellow"><p>{clue[i]}</p></div>;
      freq[clue.charCodeAt(i)-65]--;
    }else{

      format[i]=<div className="grey"><p>{clue[i]}</p></div>;
    }
  }
  //console.log(format)
  return (
    <div>
      <h1>  </h1>
      {format? format: "loading"}
      <br/>
    </div>
  )
}
function Guesser({roomId}) {
  const [clues, setClues] = useState([]);
  const [guess, setGuess] = useState("");
  const [guesses, setGuesses] = useState([]);
  const [word, setWord] = useState("");
  const [points, setPoints] = useState(0);
  const {uid} = auth.currentUser;
  const roomsCollection = firestore.collection('rooms');
  const getClues = async() => {
    let roomref = roomsCollection.doc(roomId)
    let room = await getDoc(roomref)
    console.log(room.data())
    console.log(room.get("clues"))
    setClues(room.get("clues"))
    console.log(clues)
  }
  const getPoints = async() => {
    let roomref = roomsCollection.doc(roomId)
    let room = await getDoc(roomref)
    console.log(room.data())
    console.log(room.get("users")[uid])
    setPoints(room.get("users")[uid])
  }
  const getGuesses = async() => {
    let roomref = roomsCollection.doc(roomId)
    let room = await getDoc(roomref)
    console.log(room.data())
    console.log(room.get("guesses"))
    setGuesses(room.get("guesses"))
    console.log(guesses)
    guesses.map(g => console.log(g.guess))
  }
  const getWord = async() => {
    let roomref = roomsCollection.doc(roomId)
    let room = await getDoc(roomref)
    console.log(room.data())
    console.log(room.get("word"))
    setWord(room.get("word"))
    console.log(word)
  }
  useEffect(() => {
    
    getClues();
    getGuesses();
    getWord();
    getPoints();
  }, [])
  const onChange = async (e) => {
    setGuess(e.target.value)
    getClues();
    getGuesses();
    getWord();
    getPoints();
  }
  const testGuess = async () => {
    getClues();
    getGuesses();
    getWord();
    getPoints();
    //if(clue == )
    if(guess == word) {
      console.log("win");
      // points system: more than 6 clues = 0 points guesser + writer
      // 1 clue
      await roomsCollection.doc(roomId).update({
        users: {
          uid: increment(100)
        }
      }).then(
        console.log("win")
      )
    }
    await updateDoc(roomsCollection.doc(roomId), {guesses: arrayUnion({giver: uid, guess: guess})})
  }
  return (
    <div className="guesser-container">
      <h1>Points: {points}</h1>
      {/* <p>Guesser</p> */}
      <div className='inline'>
        <section>
          {/* <h1>test</h1> */}
          {clues? clues.map(c => <DisplayClue word={word} clue={c.clue}/>): <p>loading</p>} 
          {/* //<DisplayClue word={word} clue={c.clue}/>) : <p>no clues yet</p>} */}
        </section>
      </div>


      <div className='inline'>
        <section >
          {guesses? guesses.map(g => <DisplayGuesses word={word} guess={g.guess}/>): <p>loading</p>}
        </section>
        <input
        type="text"
        name="guess"
        onChange={onChange}
        placeholder="Guess"
        value={guess}
        />
        <br/>
        <button onClick={testGuess}>Give Guess</button>
      </div>
    </div>
  )
}
// TODO add points for correct guesses and clue giver
function DisplayGuesses({word, guess}) {
  console.log(guess);
  const format = guess==word ? 'correct' : 'wrong'
  return(
    <div className={format}>
      <p>{guess}</p>
    </div>
  )
}
export default App;
