import { useState } from 'react';
import './App.css';
import { SwipeContainer } from './components/SwipeContainer';
import { PageDots } from './components/PageDots';
import { LandingScreen } from './components/LandingScreen';
import { BreathingScreen } from './components/BreathingScreen';
import { MeditationScreen } from './components/MeditationScreen';

function App() {
  const [activePage, setActivePage] = useState(0);

  return (
    <div
      data-safe-area
      className="w-screen h-dvh bg-[#5f7d60]"
      style={{
        paddingTop: 'env(safe-area-inset-top)',
        paddingLeft: 'env(safe-area-inset-left)',
        paddingRight: 'env(safe-area-inset-right)',
      }}
    >
      <SwipeContainer onPageChange={setActivePage}>
        <LandingScreen />
        <BreathingScreen />
        <MeditationScreen />
      </SwipeContainer>
      <PageDots active={activePage} />
    </div>
  );
}

export default App;
