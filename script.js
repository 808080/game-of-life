const CELL_STATES = ['#fff', '#acffaa'];
const BORDER = '#ddd';
const NEIGHBOURS = [ // [[x,y]]
    [-1, -1], [0, -1], [1, -1],
    [-1, 0], /*[0, 0],*/[1, 0],
    [-1, 1], [0, 1], [1, 1]
];
const BREAKPOINTS = {
    OVERPOPULATION: 3,
    UNDERPOPULATION: 2,
    NEWBORN: 3
};
const FPS = 5;

const CANVAS = document.getElementById('game');
const CTX = CANVAS.getContext('2d');

class Game {

    constructor(rows, cols, cellSize) {
        this.COLS = cols;
        this.ROWS = rows;

        this.CELL_SIZE = cellSize;

        CANVAS.width = rows * cellSize;
        CANVAS.height = cols * cellSize;

        this.frame = 0;

        this.init();
    };

    init = () => {
        this.isRunning = false;
        this.currentState = this.generateField();
        this.newState = this.generateField();
        this.drawGrid();
        CANVAS.addEventListener('click', this.setFirstGen);
    };

    generateField = () => Array.from(new Array(this.COLS), () => new Array(this.ROWS).fill(0));

    drawCell = (x, y, cellState) => {
        CTX.fillStyle = cellState;
        CTX.fillRect(x, y, this.CELL_SIZE, this.CELL_SIZE);
        CTX.lineWidth = 2;
        CTX.strokeStyle = BORDER;
        CTX.strokeRect(x, y, this.CELL_SIZE, this.CELL_SIZE);
    };

    drawGrid = () => {
        CTX.beginPath();
        for (let x = 0; x < CANVAS.width; x += this.CELL_SIZE) {
            CTX.moveTo(x, 0);
            CTX.lineTo(x, CANVAS.height);
        }
        for (let y = 0; y < CANVAS.height; y += this.CELL_SIZE) {
            CTX.moveTo(0, y);
            CTX.lineTo(CANVAS.width, y);
        }
        CTX.lineWidth = 2;
        CTX.strokeStyle = BORDER;
        CTX.stroke();
    };

    drawField = () => {
        const cellsToChange = [];
        this.hasSignsOfLife = false;

        for (let x = 0; x < this.ROWS; x++) {
            for (let y = 0; y < this.COLS; y++) {
                this.updateCellState(x, y);
                if (this.currentState[y][x] !== this.newState[y][x]) {
                    cellsToChange.push({
                        x,
                        y,
                        state: this.newState[y][x]
                    });
                    this.drawCell(x * this.CELL_SIZE, y * this.CELL_SIZE, CELL_STATES[this.newState[y][x]]);
                }
            }
        }

        if (!cellsToChange.length) {
            this.isRunning = false;
            cancelAnimationFrame(this.frame);
            clearTimeout(this.timeOut);

            alert(`Our civilization has ${this.hasSignsOfLife ? 'reached harmony!' : 'perished :('}`);
            if (!this.hasSignsOfLife) this.reset();
        }

        for (let i = 0; i < cellsToChange.length; i++) {
            const c = cellsToChange[i];
            this.currentState[c.y][c.x] = c.state;
        }
    };

    getNeighboursCount = (Cx, Cy) => {
        let count = 0;
        for (let i = 0; i < NEIGHBOURS.length; i++) {
            if (count > BREAKPOINTS.OVERPOPULATION) break; // exit early - the cell will die anyway
            const neighbour = NEIGHBOURS[i];

            let Nx = Cx + neighbour[0];
            let Ny = Cy + neighbour[1];

            if (Nx < 0) {
                Nx = this.ROWS - 1;
            } else if (Nx >= this.ROWS) {
                Nx = 0;
            }

            if (Ny < 0) {
                Ny = this.COLS - 1;
            } else if (Ny >= this.COLS) {
                Ny = 0;
            }

            count += this.currentState[Ny][Nx];
        }
        return count;
    };

    updateCellState = (x, y) => {
        const neighboursCount = this.getNeighboursCount(x, y);
        let isAlive = this.currentState[y][x];

        if (isAlive && (neighboursCount > BREAKPOINTS.OVERPOPULATION || neighboursCount < BREAKPOINTS.UNDERPOPULATION)) {
            isAlive = 0;
        } else if (!isAlive && neighboursCount === BREAKPOINTS.NEWBORN) {
            isAlive = 1;
        }

        this.newState[y][x] = isAlive;
        if (isAlive && !this.hasSignsOfLife) {
            this.hasSignsOfLife = isAlive;
        }
    };

    setFirstGen = (e) => {
        const x = Math.floor(e.offsetX / this.CELL_SIZE);
        const y = Math.floor(e.offsetY / this.CELL_SIZE);
        this.currentState[y][x] = +!this.currentState[y][x];
        this.drawCell(x * this.CELL_SIZE, y * this.CELL_SIZE, CELL_STATES[this.currentState[y][x]]);
    };

    render = () => {
        if (!this.isRunning) return;
        this.drawField();
        this.timeOut = setTimeout(() => {
            this.frame = requestAnimationFrame(this.render);
        }, 1000 / FPS);
    };

    start = () => {
        if (this.isRunning) return;
        this.isRunning = true;
        CANVAS.removeEventListener('click', this.setFirstGen);
        this.render();
    };

    reset = () => {
        clearTimeout(this.timeOut);
        cancelAnimationFrame(this.frame);
        CTX.clearRect(0, 0, CANVAS.width, CANVAS.height);
        this.init();
    };
}


const game = new Game(100, 50, 15);

document.getElementById('start').addEventListener('click', game.start);
document.getElementById('reset').addEventListener('click', game.reset);