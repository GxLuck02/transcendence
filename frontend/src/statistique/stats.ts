import { statsService } from '../services/stats.service';

export async function renderStatsDashboard(container: HTMLElement) {
  const userStats = await statsService.getUserStats();

  if (!userStats) {
    container.innerHTML = `
      <p style="color:red;">Impossible de charger les statistiques.</p>
    `;
    return;
  }

  // Le backend renvoie display_name et username
  container.innerHTML = `
    <h2>Nom du joueur : <strong>${(userStats as any).display_name ?? (userStats as any).username}</strong></h2>
  `;
}
