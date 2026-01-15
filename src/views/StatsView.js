import { DatabaseService } from '../services/database.js';
import { DateUtils } from '../utils/date.js';
import { AuthService } from '../services/auth.js';
import { RolesService } from '../services/roles.js';

export class StatsView {
  constructor(container) {
    this.container = container;
    // Default to current month
    const now = new Date();
    this.startDate = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
    this.endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];
  }

  async render() {
    // Verify admin
    const user = AuthService.getCurrentUser();
    const isAdmin = user ? await RolesService.isAdmin(user) : false;

    if (!isAdmin) {
      window.dispatchEvent(new CustomEvent('navegacion', { detail: { vista: 'clase' } }));
      return;
    }

    // Obtener límites de fecha
    const diasLectivos = DatabaseService.getDiasLectivos();
    const minDate = diasLectivos.length > 0 ? diasLectivos[0] : this.startDate;
    const maxDate = DateUtils.getFechaHoy();

    this.container.innerHTML = `
      <div style="max-width: 1000px; margin: 0 auto; padding: 1rem;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; flex-wrap: wrap; gap: 1rem;">
          <h2 style="margin: 0; color: var(--gray-800);">Estadísticas de Usuarios</h2>
          <div style="display: flex; gap: 0.5rem; align-items: center; flex-wrap: wrap;">
            <input type="date" id="statsStartDate" value="${this.startDate}" min="${minDate}" max="${maxDate}" style="padding: 0.5rem; border: 1px solid #ccc; border-radius: 4px;">
            <span style="white-space: nowrap;">hasta</span>
            <input type="date" id="statsEndDate" value="${this.endDate}" min="${minDate}" max="${maxDate}" style="padding: 0.5rem; border: 1px solid #ccc; border-radius: 4px;">
            <button id="btnFilterStats" style="
              padding: 0.5rem 1rem;
              background: var(--primary-color);
              color: white;
              border: none;
              border-radius: 4px;
              cursor: pointer;
            ">Filtrar</button>
          </div>
        </div>

        <div class="stats-table-container" style="background: white; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); overflow-x: auto;">
          <table style="width: 100%; border-collapse: collapse; min-width: 600px;">
            <thead style="background: #f8f9fa; border-bottom: 2px solid #eee;">
              <tr>
                <th style="padding: 1rem; text-align: left; color: var(--gray-600);">Usuario</th>
                <th style="padding: 1rem; text-align: center; color: var(--gray-600);">Total Registros</th>
                <th style="padding: 1rem; text-align: center; color: var(--gray-600);">Promedio/Día</th>
                <th style="padding: 1rem; text-align: left; color: var(--gray-600);">Detalle Diario</th>
              </tr>
            </thead>
            <tbody id="statsTableBody">
              <tr><td colspan="4" style="padding: 2rem; text-align: center;">Cargando datos...</td></tr>
            </tbody>
          </table>
        </div>
      </div>
    `;

    this.attachEvents();
    this.loadStats();
  }

  attachEvents() {
    const btn = this.container.querySelector('#btnFilterStats');
    const startInput = this.container.querySelector('#statsStartDate');
    const endInput = this.container.querySelector('#statsEndDate');

    if (btn) {
      btn.onclick = () => {
        this.startDate = startInput.value;
        this.endDate = endInput.value;
        this.loadStats();
      };
    }
  }

  loadStats() {
    const tbody = this.container.querySelector('#statsTableBody');
    if (!tbody) return;

    const stats = DatabaseService.getUserActivityStats(this.startDate, this.endDate);

    // Calculate days diff for average transparency
    const start = new Date(this.startDate);
    const end = new Date(this.endDate);
    const daysDiff = Math.max(1, Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1);

    if (stats.length === 0) {
      tbody.innerHTML = `<tr><td colspan="4" style="padding: 2rem; text-align: center; color: #888;">No hay registros en este periodo.</td></tr>`;
      return;
    }

    tbody.innerHTML = stats.map((userStat, index) => {
      // Sort dates descending
      const dates = Object.entries(userStat.byDate).sort((a, b) => b[0].localeCompare(a[0]));
      const recentActivity = dates.slice(0, 5).map(([date, count]) =>
        `<span style="
          display: inline-block; 
          padding: 2px 6px; 
          background: #eef2ff; 
          color: #4f46e5; 
          border-radius: 4px; 
          font-size: 0.8rem; 
          margin-right: 4px;
        ">${DateUtils.formatDateHeader(date)}: <b>${count}</b></span>`
      ).join('');

      const hasMore = dates.length > 5;
      const average = (userStat.total / daysDiff).toFixed(1);

      return `
        <tr style="border-bottom: 1px solid #eee;">
          <td style="padding: 1rem;">
            <div style="font-weight: 500;">${userStat.email.split('@')[0]}</div>
            <div style="font-size: 0.85rem; color: #888;">${userStat.email}</div>
          </td>
          <td style="padding: 1rem; text-align: center;">
            <span style="font-weight: bold; font-size: 1.1rem;">${userStat.total}</span>
          </td>
          <td style="padding: 1rem; text-align: center; color: #666;">
            ${average}
          </td>
          <td style="padding: 1rem;">
            <div style="display: flex; flex-wrap: wrap; gap: 4px;">
              ${recentActivity}
              ${hasMore ? `<span style="font-size: 0.8rem; color: #888; align-self: center;">+${dates.length - 5} más...</span>` : ''}
            </div>
          </td>
        </tr>
      `;
    }).join('');
  }
}
