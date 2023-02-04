import firebase, { initializeApp } from 'firebase/compat/app';
import 'firebase/compat/firestore';
import 'firebase/compat/auth';
import 'react-router-dom'
import { BrowserRouter, Routes, Route, useParams, createRoutesFromChildren } from 'react-router-dom'
import { useNavigate } from "react-router-dom";
import { collectionGroup, query, where, getDocs, updateDoc, arrayUnion, doc, getFirestore, getDoc, increment } from "firebase/firestore";  
import React, { useEffect, useState } from 'react';
import {Writer} from './Writer';
import {Guesser} from './Guesser'
import { useAuthState } from 'react-firebase-hooks/auth';

export function Game() {
  
    const auth = firebase.auth();
    const firestore = firebase.firestore();
    const { user } = useAuthState(auth);
    const {uid} = auth.currentUser;
    const params = useParams();
    // console.log("game");
    let room
    const roomsCollection = firestore.collection('rooms');
    const [writer, setWriter] = useState(null)
    const [points, setPoints] = useState(0)
    const [names, setNames] = useState([])
    const [callback, setCallback] = useState(false);
    const getWriter = async() => {
      let roomref = roomsCollection.doc(params.id)
      room = await getDoc(roomref)
      console.log(room.data())
      console.log(room.get("writer").name)
      setWriter(room.get("writer").id)
    }
    const getPoints = async() => {
      let roomref = roomsCollection.doc(params.id)
      room = await getDoc(roomref)
      console.log(room.data())
      console.log(room.get("users")[uid])//.points)
      setPoints(room.get("users")[uid].points)//.points)
    }
    const getName = async() => {
      let roomref = roomsCollection.doc(params.id)
      room = await getDoc(roomref)
      console.log(room.data())
      console.log(room.get("names"))//.username)
      setNames(room.get("names").map(a => a.name))//.username)
    }
    useEffect(() => {
      getWriter();
      getPoints();
      getName();
      console.log(writer)
    },[callback])
    return (
      <>
      <header className="App-header">
        <h1>Game</h1>
        <h2>Writer: {writer? writer:"wait"}</h2>
        <h2>Current players:</h2>
        {names? names.map(c => <p>{c}</p>): <h2>loading</h2>}
        <h2>{uid}</h2>
        <h2>Points: {points}</h2>
      </header>
      <section>
        { (writer == uid)? <Writer roomId={params.id}/> : <Guesser roomId={params.id} callback={setCallback}/>}
      </section>
      </>
    )
  }
  