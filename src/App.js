import React, { useState } from 'react';
import CryptoRaceLobby from './components/CryptoRaceLobby';
import CryptoChickenRace from './components/CryptoChickenRace';

const App = () => {
  const [gameState, setGameState] = useState({
    inLobby: true,
    roomCode: null,
    playerName: '',
    isHost: false,
  });

  const handleJoinRoom = (roomCode, playerName, isHost) => {
    setGameState({
      inLobby: false,
      roomCode,
      playerName,
      isHost,
    });
  };

  return (
    <div>
      {gameState.inLobby ? (
        <CryptoRaceLobby onJoinRoom={handleJoinRoom} />
      ) : (
        <CryptoChickenRace
          roomCode={gameState.roomCode}
          playerName={gameState.playerName}
          isHost={gameState.isHost}
        />
      )}
    </div>
  );
};

export default App;