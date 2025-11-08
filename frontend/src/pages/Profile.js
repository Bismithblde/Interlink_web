import React from 'react';
import { Card, CardContent, Typography, Avatar, Box } from '@mui/material';

function Profile() {
  return (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Avatar sx={{ width: 56, height: 56, mr: 2 }}>U</Avatar>
          <Typography variant="h5">User Name</Typography>
        </Box>
        <Typography variant="body1">
          This is my bio. I'm interested in meeting new people and completing tasks on InterLink.
        </Typography>
        <Box sx={{ mt: 2 }}>
          <Typography>Tasks Done: 0</Typography>
          <Typography>Connections Made: 0</Typography>
        </Box>
      </CardContent>
    </Card>
  );
}

export default Profile;
