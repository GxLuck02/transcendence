export default async function statsRoutes(app) {
    
    // Route GET du user co appel JWT 
    app.get('/api/users/stats', { preValidation: [app.authenticate] }, async (request, reply) => {
        const userID = request.user.userID;
        const user = app.db.getUserByID(userID);
        if (!user) {
            return reply.status(404).send({ error: 'User not found' });
        }

        reply.send({
          username: user.username,
          display_name: user.display_name,
          avatar: user.avatar,
          wins: user.wins,
          losses: user.losses,
          win_rate: calcWinRate(user.wins, user.losses),
          pong_wins: user.pong_wins,
          pong_losses: user.pong_losses,
          pong_win_rate: calcWinRate(user.pong_wins, user.pong_losses),
        });
    });

    // Route GET des stats d un ami
    app.get('/api/users/:id/stats/', { preValidation: [app.authenticate] }, async (request, reply) => {
        const userID = Number(request.params.id);
        const user = app.db.getUserByID(userID);
        if (!user) {
            return reply.status(404).send({ error: 'User not found' });
        }

        reply.send({
          username: user.username,
          display_name: user.display_name,
          avatar: user.avatar,
          wins: user.wins,
          losses: user.losses,
          win_rate: calcWinRate(user.wins, user.losses),
          pong_wins: user.pong_wins,
          pong_losses: user.pong_losses,
          pong_win_rate: calcWinRate(user.pong_wins, user.pong_losses),
        });
    });

    function calcWinRate(w, l) {
        const total = w + l;
        return  total === 0 ? 0 : Math.round(((w / total) * 100). toFixed(1)); // Calcul du pourcentage de win et arrondi a un chiffre apres la virgule
    }
};