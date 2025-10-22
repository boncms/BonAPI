export type ScrapeType = 'movies' | 'categories' | 'actors' | 'countries'

export interface ScrapeLogEntry {
	timestamp: string
	type: ScrapeType
	title: string
	status: 'created' | 'updated' | 'error' | 'info'
	message?: string
}

export interface ScrapingState {
	isRunning: boolean
	currentPage: number
	totalPages: number
	processed: number
	total: number
	errors: number
	created: number
	updated: number
	currentItem: string
	type: ScrapeType
	keyword?: string
	logs: ScrapeLogEntry[]
}

export const scrapingState: ScrapingState = {
	isRunning: false,
	currentPage: 0,
	totalPages: 0,
	processed: 0,
	total: 0,
	errors: 0,
	created: 0,
	updated: 0,
	currentItem: '',
	type: 'movies',
	keyword: '',
	logs: []
}

export function appendLog(entry: Omit<ScrapeLogEntry, 'timestamp'>) {
	const newEntry: ScrapeLogEntry = {
		timestamp: new Date().toISOString(),
		...entry
	}
	scrapingState.logs.push(newEntry)
	// keep only last 200
	if (scrapingState.logs.length > 200) {
		scrapingState.logs.splice(0, scrapingState.logs.length - 200)
	}
}


