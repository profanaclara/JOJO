class FreeHourglassRenderer {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas?.getContext("2d");
        this.tempCanvas = document.createElement("canvas");
        this.tempCtx = this.tempCanvas.getContext("2d", { willReadFrequently: true });
        this.resolutionScale = 1.5;
        this.width = 300;
        this.height = 600;
        this.canvas.width = this.width;
        this.canvas.height = this.height;
        this.tempCanvas.width = this.width;
        this.tempCanvas.height = this.height;
        this.cx = this.width / 2;
        this.gateRow = this.height / 2;
        this.grid = new Uint32Array(this.width * this.height);
        this.imgData = this.tempCtx.createImageData(this.width, this.height);
        this.data32 = new Uint32Array(this.imgData.data.buffer);
        this.totalGrainsInit = 0;
        this.currentGrainsTop = 0;
        this.totalSeconds = 0;
        this.remainingSeconds = 0;
        this.lastTime = 0;
        this.grainsPerSecond = 0;
        this.dropAccumulator = 0;
        this.isRunning = false;
        this.direction = true;
        this.glassPath = new Path2D();
        this.buildPaths();
        this.initLiquid();
        this.frameId = 0;
        this.animate = this.animate.bind(this);
        this.frameId = window.requestAnimationFrame(this.animate);
    }

    color(r, g, b) {
        return (255 << 24) | (b << 16) | (g << 8) | r;
    }

    scale(value) {
        return Math.round(value * this.resolutionScale);
    }

    lerpColor(c1, c2, t) {
        return this.color(
            Math.round(c1.r + (c2.r - c1.r) * t),
            Math.round(c1.g + (c2.g - c1.g) * t),
            Math.round(c1.b + (c2.b - c1.b) * t)
        );
    }

    get colorStops() {
        return [
            { r: 255, g: 107, b: 158 },
            { r: 255, g: 175, b: 115 },
            { r: 255, g: 238, b: 115 },
            { r: 133, g: 238, b: 158 },
            { r: 115, g: 200, b: 255 },
            { r: 186, g: 133, b: 255 }
        ];
    }

    getGradientColor(t) {
        const clamped = Math.max(0, Math.min(1, t));
        const scaled = clamped * (this.colorStops.length - 1);
        const idx = Math.floor(scaled);

        if (idx >= this.colorStops.length - 1) {
            const stop = this.colorStops[idx];
            return this.color(stop.r, stop.g, stop.b);
        }

        return this.lerpColor(this.colorStops[idx], this.colorStops[idx + 1], scaled - idx);
    }

    buildPaths() {
        this.glassPath.moveTo(this.scale(30), this.scale(80));
        this.glassPath.arc(this.scale(100), this.scale(80), this.scale(70), Math.PI, 0);
        this.glassPath.bezierCurveTo(this.scale(170), this.scale(140), this.scale(110), this.scale(180), this.scale(110), this.scale(200));
        this.glassPath.bezierCurveTo(this.scale(110), this.scale(220), this.scale(170), this.scale(260), this.scale(170), this.scale(320));
        this.glassPath.arc(this.scale(100), this.scale(320), this.scale(70), 0, Math.PI);
        this.glassPath.bezierCurveTo(this.scale(30), this.scale(260), this.scale(90), this.scale(220), this.scale(90), this.scale(200));
        this.glassPath.bezierCurveTo(this.scale(90), this.scale(180), this.scale(30), this.scale(140), this.scale(30), this.scale(80));
        this.glassPath.closePath();
    }

    buildGlassLimits() {
        this.grid.fill(0);

        for (let y = 0; y < this.height; y += 1) {
            for (let x = 0; x < this.width; x += 1) {
                if (!this.ctx.isPointInPath(this.glassPath, x, y)) {
                    this.grid[y * this.width + x] = 1;
                }
            }
        }

        for (let x = 0; x < this.width; x += 1) {
            if (this.grid[(this.gateRow - 1) * this.width + x] === 0) {
                this.grid[(this.gateRow - 1) * this.width + x] = 1;
            }
            if (this.grid[this.gateRow * this.width + x] === 0) {
                this.grid[this.gateRow * this.width + x] = 1;
            }
        }
    }

    initLiquid() {
        this.buildGlassLimits();
        this.totalGrainsInit = 0;

        for (let y = this.scale(20); y < this.gateRow - this.scale(2); y += 1) {
            const colorHex = this.getGradientColor((y - this.scale(20)) / this.scale(160));
            for (let x = 0; x < this.width; x += 1) {
                if (this.grid[y * this.width + x] === 0) {
                    this.grid[y * this.width + x] = colorHex;
                    this.totalGrainsInit += 1;
                }
            }
        }

        this.currentGrainsTop = this.totalGrainsInit;
    }

    pluckGrainFromTop() {
        for (let r = 1; r < this.scale(120); r += 1) {
            for (let angle = Math.PI; angle <= Math.PI * 2; angle += 0.1) {
                const tx = Math.round(this.cx + Math.cos(angle) * r);
                const ty = Math.round((this.gateRow - this.scale(2)) + Math.sin(angle) * r);
                if (ty >= 0 && ty < this.gateRow && tx >= 0 && tx < this.width) {
                    if (this.grid[ty * this.width + tx] > 1) {
                        const c = this.grid[ty * this.width + tx];
                        this.grid[ty * this.width + tx] = 0;
                        return c;
                    }
                }
            }
        }

        return 0;
    }

    dropGrainAtBottom(c) {
        if (c <= 1) return;

        const spread = this.scale(4);
        const sx = this.cx + Math.floor(Math.random() * ((spread * 2) + 1)) - spread;
        const sy = this.gateRow + this.scale(2) + Math.floor(Math.random() * this.scale(20));

        if (this.grid[sy * this.width + sx] === 0) {
            this.grid[sy * this.width + sx] = c;
            return;
        }

        for (let dy = sy; dy < this.height; dy += 1) {
            if (this.grid[dy * this.width + this.cx] === 0) {
                this.grid[dy * this.width + this.cx] = c;
                break;
            }
        }
    }

    updatePhysics() {
        this.direction = !this.direction;

        for (let y = this.height - 2; y >= 0; y -= 1) {
            const startX = this.direction ? 1 : this.width - 2;
            const endX = this.direction ? this.width - 1 : 0;
            const stepX = this.direction ? 1 : -1;

            for (let x = startX; x !== endX; x += stepX) {
                const i = y * this.width + x;
                const grain = this.grid[i];

                if (grain <= 1) continue;

                const below = i + this.width;
                if (this.grid[below] === 0) {
                    this.grid[below] = grain;
                    this.grid[i] = 0;
                    continue;
                }

                const dir = Math.random() < 0.5 ? 1 : -1;
                if (this.grid[below + dir] === 0) {
                    this.grid[below + dir] = grain;
                    this.grid[i] = 0;
                } else if (this.grid[below - dir] === 0) {
                    this.grid[below - dir] = grain;
                    this.grid[i] = 0;
                } else if (this.grid[i + dir] === 0) {
                    this.grid[i + dir] = grain;
                    this.grid[i] = 0;
                } else if (this.grid[i - dir] === 0) {
                    this.grid[i - dir] = grain;
                    this.grid[i] = 0;
                }
            }
        }
    }

    drawVisuals() {
        for (let i = 0; i < this.grid.length; i += 1) {
            this.data32[i] = this.grid[i] > 1 ? this.grid[i] : 0;
        }

        this.tempCtx.putImageData(this.imgData, 0, 0);
        this.ctx.clearRect(0, 0, this.width, this.height);
        this.ctx.filter = `blur(${this.scale(0.3)}px)`;
        this.ctx.drawImage(this.tempCanvas, 0, 0);
        this.ctx.filter = "none";
        this.ctx.lineJoin = "round";
        this.ctx.lineCap = "round";

        this.ctx.save();
        this.ctx.shadowColor = "rgba(67, 120, 190, 0.22)";
        this.ctx.shadowBlur = this.scale(4);
        this.ctx.strokeStyle = "rgba(255, 255, 255, 0.98)";
        this.ctx.lineWidth = this.scale(2);
        this.ctx.stroke(this.glassPath);
        this.ctx.restore();

        this.ctx.strokeStyle = "rgba(255, 255, 255, 0.8)";
        this.ctx.lineWidth = this.scale(3);
        this.ctx.beginPath();
        this.ctx.arc(this.scale(100), this.scale(80), this.scale(50), Math.PI * 0.85, Math.PI * 1.25);
        this.ctx.stroke();

        this.ctx.beginPath();
        this.ctx.arc(this.scale(100), this.scale(320), this.scale(50), Math.PI * 0.65, Math.PI * 0.95);
        this.ctx.stroke();
    }

    forceEmptyTop() {
        for (let y = 0; y < this.gateRow; y += 1) {
            for (let x = 0; x < this.width; x += 1) {
                if (this.grid[y * this.width + x] > 1) {
                    const c = this.grid[y * this.width + x];
                    this.grid[y * this.width + x] = 0;
                    this.dropGrainAtBottom(c);
                }
            }
        }
        this.currentGrainsTop = 0;
    }

    animate(timestamp) {
        let dt = (timestamp - this.lastTime) / 1000;
        if (dt > 0.1) dt = 0.016;
        this.lastTime = timestamp;

        if (this.isRunning) {
            this.remainingSeconds -= dt;

            if (this.remainingSeconds <= 0) {
                this.remainingSeconds = 0;
                this.forceEmptyTop();
                this.isRunning = false;
            } else {
                this.dropAccumulator += this.grainsPerSecond * dt;
                const dropsThisFrame = Math.floor(this.dropAccumulator);

                if (dropsThisFrame > 0 && this.currentGrainsTop > 0) {
                    for (let i = 0; i < dropsThisFrame; i += 1) {
                        const c = this.pluckGrainFromTop();
                        if (c > 1) {
                            this.dropGrainAtBottom(c);
                            this.currentGrainsTop -= 1;
                        }
                    }
                    this.dropAccumulator -= dropsThisFrame;
                }
            }
        }

        this.updatePhysics();
        this.updatePhysics();
        this.drawVisuals();
        this.frameId = window.requestAnimationFrame(this.animate);
    }

    start(seconds = 60) {
        if (!this.ctx) return;

        if (this.remainingSeconds === 0 || this.totalSeconds !== seconds) {
            this.totalSeconds = seconds;
            this.remainingSeconds = seconds;
            this.initLiquid();
            this.grainsPerSecond = this.totalGrainsInit / this.totalSeconds;
            this.dropAccumulator = 0;
        }

        this.isRunning = true;
        this.lastTime = performance.now();
    }

    pause() {
        this.isRunning = false;
    }

    reset() {
        this.isRunning = false;
        this.remainingSeconds = 0;
        this.totalSeconds = 0;
        this.dropAccumulator = 0;
        this.initLiquid();
    }

    redraw() {
        if (this.ctx) this.drawVisuals();
    }
}

window.FreeHourglassRenderer = FreeHourglassRenderer;
