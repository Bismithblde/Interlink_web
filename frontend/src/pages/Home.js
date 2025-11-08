import React from 'react';
import { Card, CardContent, Typography, Button } from '@mui/material';

function Home() {
  return (
    <Card>
      <CardContent>
        <Typography variant="h4" component="div">
          Welcome to InterLink
        </Typography>
        <Typography sx={{ mt: 2 }} color="text.secondary">
          The place to make new friends.
        </Typography>
        <Button variant="contained" sx={{ mt: 2 }}>Get Started</Button>
      </CardContent>
    </Card>
  );
}

export default Home;
