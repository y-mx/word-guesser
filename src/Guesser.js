import firebase, { initializeApp } from 'firebase/compat/app';
import 'firebase/compat/firestore';
import 'firebase/compat/auth';
import 'react-router-dom'
import { BrowserRouter, Routes, Route, useParams, createRoutesFromChildren } from 'react-router-dom'
import { collectionGroup, query, where, getDocs, updateDoc, arrayUnion, doc, getFirestore, getDoc, increment } from "firebase/firestore";  
import { useNavigate } from "react-router-dom";
import React, { useEffect, useState } from 'react';
import { DisplayClue } from './Writer';
import { useAuthState } from 'react-firebase-hooks/auth';

import Button from 'react-bootstrap/Button';
import Modal from 'react-bootstrap/Modal';

export function Guesser({roomId, callback}) {
  
  const auth = firebase.auth();
    const firestore = firebase.firestore();
    const [clues, setClues] = useState([]);
    const [guess, setGuess] = useState("");
    const [guesses, setGuesses] = useState([]);
    const [word, setWord] = useState("");
    const [points, setPoints] = useState(0);
    const [show, setShow] = useState(false);
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
      setPoints(room.get("users")[uid].points)
    }
    const getGuesses = async() => {
      let roomref = roomsCollection.doc(roomId)
      let room = await getDoc(roomref)
      console.log(room.data())
      console.log(room.get("guesses"))
      setGuesses(room.get("guesses"))
      console.log(guesses)
      // guesses.map(g => console.log(g.guess))
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
        let usersUpdate = `users.${uid}.points`

        // updateDoc(roomsCollection.doc(roomId), {
        //   "" : increment(100)
        // })
        roomsCollection.doc(roomId).update({
          [`users.${uid}.points`]: increment(100)
        }, {merge: true}).then(
          handleShow()
        )
        
        await roomsCollection.doc(roomId).update({
          word: ""
        })
        await roomsCollection.doc(roomId).update({
          writer: {id: uid, name: " "}
        })
        await roomsCollection.doc(roomId).update({
          clues: []
        })
        await roomsCollection.doc(roomId).update({
          guesses: []
        })
        setClues([])
      } else {
        await updateDoc(roomsCollection.doc(roomId), {guesses: arrayUnion({giver: uid, guess: guess})})
      }
    }
    const handleClose = () => {
      setShow(false);
      // rerender parent
      callback(true);
    }
    const handleShow = () => setShow(true);
    return (
      <div className="guesser-container">
        {/* <h1>Points: {points}</h1> */}
        <div
          className="modal show"
          style={{ display: 'block', position: 'initial' }}>
          <Modal show={show} onHide={handleClose}>
          <Modal.Header closeButton>
            <Modal.Title>Round over</Modal.Title>
          </Modal.Header>
          <Modal.Body>You win! Now you are the writer</Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={handleClose}>
              Close
            </Button>
          </Modal.Footer>
          </Modal>
        </div>
        
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

  function DisplayGuesses({word, guess}) {
    console.log(guess);
    const format = guess==word ? 'correct' : 'wrong'
    return(
      <div className={format}>
        <p>{guess}</p>
      </div>
    )
  }