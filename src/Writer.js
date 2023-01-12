import firebase, { initializeApp } from 'firebase/compat/app';
import 'firebase/compat/firestore';
import 'firebase/compat/auth';
import 'react-router-dom'
import { BrowserRouter, Routes, Route, useParams, createRoutesFromChildren } from 'react-router-dom'
import { collectionGroup, query, where, getDocs, updateDoc, arrayUnion, doc, getFirestore, getDoc, increment } from "firebase/firestore";  
import { useNavigate } from "react-router-dom";
import React, { useEffect, useState } from 'react';

import { useAuthState } from 'react-firebase-hooks/auth';

import { answers } from './answers';
import { wordlist } from './words';

const getRandomWord = () => {
  const line = Math.floor(Math.random()*2309);
  return answers[line];
}

// const words = fs.readFileSync('../words.txt')
// const wordlist = words.split(EOL)

const checkWord = (word) => {
  return wordlist.includes(word)
}

export function Writer({roomId}) {
    const firestore = firebase.firestore();
    const auth = firebase.auth();
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
      if(!word || word.length != 5) {
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
      if(!clue || clue.length != 5) {
        return;
      }
      let isValid = true;
      if(!checkWord(clue)) {
        console.log(clue+" not valid")
        console.log(wordlist.includes(clue))
        isValid = false;
      }
      console.log(checkWord(clue))
      console.log(wordlist.includes(clue))
      if(!isValid) {
        return;
      }
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

  export function DisplayClue({word, clue}) {
    if(!word || !clue) {
      return (
        <div>
          <h1>loading</h1>
        </div>
      )
    }
    clue = clue.toUpperCase()
    word = word.toUpperCase()
    let freq = Array(26).fill(0);
    for(let i=0; i<5; i++) {
      freq[word.charCodeAt(i)-65]+=1
    }
    let format = Array(5)
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
    return (
      <div>
        <h1>  </h1>
        {format? format: "loading"}
        <br/>
      </div>
    )
  }