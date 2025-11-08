import React from 'react';
import { BrowserRouter as Router, Route, Routes, Link as RouterLink } from 'react-router-dom';
import Home from './pages/Home';
import Profile from './pages/Profile';
import FindFriend from './pages/FindFriend';
import Leaderboard from './pages/Leaderboard';
import { AppBar, Toolbar, Button, Container, CssBaseline, Typography } from '@mui/material';

function App() {
  return (
    <Router>
      <CssBaseline />
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            InterLink
          </Typography>
          <Button color="inherit" component={RouterLink} to="/">Home</Button>
          <Button color="inherit" component={RouterLink} to="/profile">Profile</Button>
          <Button color="inherit" component={RouterLink} to="/find-friend">Find Friend</Button>
          <Button color="inherit" component={RouterLink} to="/leaderboard">Leaderboard</Button>
        </Toolbar>
      </AppBar>
      <Container sx={{ mt: 4 }}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/find-friend" element={<FindFriend />} />
          <Route path="/leaderboard" element={<Leaderboard />} />
        </Routes>
      </Container>
    </Router>
  );
}

export default App;
