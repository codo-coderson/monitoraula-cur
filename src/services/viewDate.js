import { DateUtils } from '../utils/date.js';
import { DatabaseService } from './database.js';

export const ViewDateService = {
    currentDate: DateUtils.getFechaHoy(),

    getDate() {
        return this.currentDate;
    },

    setDate(date) {
        this.currentDate = date;
        window.dispatchEvent(new CustomEvent('view-date-changed', { detail: date }));
    },

    isToday() {
        return this.currentDate === DateUtils.getFechaHoy();
    },

    previousDay() {
        this.setDate(DateUtils.addDays(this.currentDate, -1));
    },

    nextDay() {
        if (!this.isToday()) {
            this.setDate(DateUtils.addDays(this.currentDate, 1));
        }
    },

    async isOldestDate() {
        // TODO: Connect with DatabaseService to check if we reached the oldest record
        // For now, we return false to allow navigation back
        // Implementing this properly requires scanning all records which might be expensive
        // A better approach might be to just let them go back indefinitely until empty

        // Optimization: Check against the oldest date in cache if available
        const dias = DatabaseService.getDiasLectivos();
        if (dias.length > 0) {
            return this.currentDate <= dias[0];
        }
        return false;
    }
};
