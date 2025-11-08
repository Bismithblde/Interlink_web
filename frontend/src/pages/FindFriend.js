import React, { useState } from 'react';
import { Card, CardContent, Typography, Button, ButtonGroup, Box } from '@mui/material';

function FindFriend() {
  const [groupSize, setGroupSize] = useState(2);

  return (
    <Card>
      <CardContent>
        <Typography variant="h5">Find Friends</Typography>
        <Typography sx={{ mt: 2 }}>Select Group Size:</Typography>
        <ButtonGroup variant="contained" sx={{ mt: 1 }}>
          <Button onClick={() => setGroupSize(2)} disabled={groupSize === 2}>2</Button>
          <Button onClick={() => setGroupSize(3)} disabled={groupSize === 3}>3</Button>
          <Button onClick={() => setGroupSize(4)} disabled={groupSize === 4}>4</Button>
        </ButtonGroup>
        <Box sx={{ mt: 2 }}>
          <Typography>Selected Group Size: {groupSize}</Typography>
          <Button variant="contained" color="primary" sx={{ mt: 2 }} onClick={() => alert(`Searching for a group of ${groupSize}`)}>
            Find Now
          </Button>
        </Box>
      </CardContent>
    </Card>
  );
}

export default FindFriend;
