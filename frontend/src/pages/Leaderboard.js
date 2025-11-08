import React from 'react';
import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Typography } from '@mui/material';

const leaderboardData = [
  { id: '1', name: 'User A', connections: 150, tasks: 200, level: 25 },
  { id: '2', name: 'User B', connections: 120, tasks: 180, level: 22 },
  { id: '3', name: 'User C', connections: 100, tasks: 150, level: 20 },
];

function Leaderboard() {
  return (
    <Paper>
      <Typography variant="h5" sx={{ p: 2 }}>Leaderboard</Typography>
      <TableContainer>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Rank</TableCell>
              <TableCell>Name</TableCell>
              <TableCell>Connections</TableCell>
              <TableCell>Tasks</TableCell>
              <TableCell>Level</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {leaderboardData.map((item, index) => (
              <TableRow key={item.id}>
                <TableCell>{index + 1}</TableCell>
                <TableCell>{item.name}</TableCell>
                <TableCell>{item.connections}</TableCell>
                <TableCell>{item.tasks}</TableCell>
                <TableCell>{item.level}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Paper>
  );
}

export default Leaderboard;
