<script>
    import { onMount, onDestroy, createEventDispatcher } from 'svelte';
    import rough from 'roughjs';
    import {
        Pen,
        Square,
        Circle,
        Minus,
        Eraser,
        Undo,
        Redo,
        Trash2,
        Save,
        X,
        Palette,
        Settings
    } from 'lucide-svelte';

    import Button from '../../components/ui/Button.svelte';
    import Modal from '../../components/ui/Modal.svelte';

    // Props
    export let open = false;
    export let initialDrawing = null;
    export let width = 800;
    export let height = 600;
    export let className = '';

    // Event dispatcher
    const dispatch = createEventDispatcher();

    // Canvas and drawing state
    let canvas;
    let ctx;
    let roughCanvas;
    let isDrawing = false;
    let currentPath = [];
    let drawings = [];
    let undoStack = [];
    let redoStack = [];

    // Tool state
    let currentTool = 'pen';
    let strokeColor = '#000000';
    let strokeWidth = 2;
    let fillColor = 'transparent';
    let roughness = 1;

    // Drawing state
    let startX = 0;
    let startY = 0;
    let currentX = 0;
    let currentY = 0;

    // Color palette
    const colors = [
        '#000000', '#dc2626', '#ea580c', '#d97706', '#65a30d',
        '#059669', '#0891b2', '#2563eb', '#7c3aed', '#c026d3',
        '#e11d48', '#374151', '#6b7280', '#9ca3af', '#ffffff'
    ];

    // Tools configuration
    const tools = [
        { id: 'pen', name: 'Pen', icon: Pen },
        { id: 'rectangle', name: 'Rectangle', icon: Square },
        { id: 'circle', name: 'Circle', icon: Circle },
        { id: 'line', name: 'Line', icon: Minus },
        { id: 'eraser', name: 'Eraser', icon: Eraser }
    ];

    // Initialize canvas
    onMount(() => {
        if (canvas) {
            ctx = canvas.getContext('2d');
            roughCanvas = rough.canvas(canvas);

            // Set canvas size
            canvas.width = width;
            canvas.height = height;

            // Configure context
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';

            // Load initial drawing if provided
            if (initialDrawing) {
                loadDrawing(initialDrawing);
            }

            // Clear the canvas
            clearCanvas();
        }
    });

    // Event handlers
    function getMousePos(e) {
        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;

        return {
            x: (e.clientX - rect.left) * scaleX,
            y: (e.clientY - rect.top) * scaleY
        };
    }

    function getTouchPos(e) {
        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;

        return {
            x: (e.touches[0].clientX - rect.left) * scaleX,
            y: (e.touches[0].clientY - rect.top) * scaleY
        };
    }

    function startDrawing(e) {
        e.preventDefault();
        isDrawing = true;

        const pos = e.type.includes('touch') ? getTouchPos(e) : getMousePos(e);
        startX = pos.x;
        startY = pos.y;
        currentX = pos.x;
        currentY = pos.y;

        if (currentTool === 'pen') {
            currentPath = [{ x: pos.x, y: pos.y }];
        } else if (currentTool === 'eraser') {
            erase(pos.x, pos.y);
        }

        // Save state for undo
        saveState();
    }

    function draw(e) {
        if (!isDrawing) return;
        e.preventDefault();

        const pos = e.type.includes('touch') ? getTouchPos(e) : getMousePos(e);
        currentX = pos.x;
        currentY = pos.y;

        if (currentTool === 'pen') {
            currentPath.push({ x: pos.x, y: pos.y });
            redrawCanvas();
            drawCurrentPath();
        } else if (currentTool === 'eraser') {
            erase(pos.x, pos.y);
        } else {
            // For shapes, redraw everything and show preview
            redrawCanvas();
            drawPreviewShape();
        }
    }

    function stopDrawing(e) {
        if (!isDrawing) return;
        e.preventDefault();

        isDrawing = false;

        if (currentTool === 'pen' && currentPath.length > 1) {
            drawings.push({
                type: 'path',
                path: [...currentPath],
                strokeColor,
                strokeWidth,
                roughness
            });
        } else if (currentTool !== 'pen' && currentTool !== 'eraser') {
            const shape = createShape();
            if (shape) {
                drawings.push(shape);
            }
        }

        currentPath = [];
        redrawCanvas();
        clearRedoStack();
    }

    function createShape() {
        const width = Math.abs(currentX - startX);
        const height = Math.abs(currentY - startY);

        if (width < 5 && height < 5) return null;

        const x = Math.min(startX, currentX);
        const y = Math.min(startY, currentY);

        switch (currentTool) {
            case 'rectangle':
                return {
                    type: 'rectangle',
                    x, y, width, height,
                    strokeColor, strokeWidth, fillColor, roughness
                };
            case 'circle':
                const radius = Math.sqrt(width * width + height * height) / 2;
                return {
                    type: 'circle',
                    x: startX, y: startY, radius,
                    strokeColor, strokeWidth, fillColor, roughness
                };
            case 'line':
                return {
                    type: 'line',
                    x1: startX, y1: startY, x2: currentX, y2: currentY,
                    strokeColor, strokeWidth, roughness
                };
            default:
                return null;
        }
    }

    function drawCurrentPath() {
        if (currentPath.length < 2) return;

        ctx.strokeStyle = strokeColor;
        ctx.lineWidth = strokeWidth;
        ctx.beginPath();
        ctx.moveTo(currentPath[0].x, currentPath[0].y);

        for (let i = 1; i < currentPath.length; i++) {
            ctx.lineTo(currentPath[i].x, currentPath[i].y);
        }

        ctx.stroke();
    }

    function drawPreviewShape() {
        const shape = createShape();
        if (!shape) return;

        ctx.save();
        ctx.globalAlpha = 0.7;
        drawShape(shape);
        ctx.restore();
    }

    function drawShape(shape) {
        const options = {
            stroke: shape.strokeColor,
            strokeWidth: shape.strokeWidth,
            fill: shape.fillColor === 'transparent' ? undefined : shape.fillColor,
            roughness: shape.roughness
        };

        switch (shape.type) {
            case 'path':
                if (shape.path.length < 2) break;
                ctx.strokeStyle = shape.strokeColor;
                ctx.lineWidth = shape.strokeWidth;
                ctx.beginPath();
                ctx.moveTo(shape.path[0].x, shape.path[0].y);
                for (let i = 1; i < shape.path.length; i++) {
                    ctx.lineTo(shape.path[i].x, shape.path[i].y);
                }
                ctx.stroke();
                break;

            case 'rectangle':
                roughCanvas.rectangle(shape.x, shape.y, shape.width, shape.height, options);
                break;

            case 'circle':
                roughCanvas.circle(shape.x, shape.y, shape.radius * 2, options);
                break;

            case 'line':
                roughCanvas.line(shape.x1, shape.y1, shape.x2, shape.y2, options);
                break;
        }
    }

    function redrawCanvas() {
        clearCanvas();
        drawings.forEach(drawing => {
            drawShape(drawing);
        });
    }

    function clearCanvas() {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    function erase(x, y) {
        const eraseRadius = strokeWidth * 3;

        drawings = drawings.filter(drawing => {
            if (drawing.type === 'path') {
                // Remove path points within erase radius
                drawing.path = drawing.path.filter(point => {
                    const dist = Math.sqrt((point.x - x) ** 2 + (point.y - y) ** 2);
                    return dist > eraseRadius;
                });
                return drawing.path.length > 1;
            }

            // For shapes, check if erase point is within shape bounds
            return !isPointInShape(x, y, drawing, eraseRadius);
        });

        redrawCanvas();
    }

    function isPointInShape(x, y, shape, radius) {
        switch (shape.type) {
            case 'rectangle':
                return x >= shape.x - radius && x <= shape.x + shape.width + radius &&
                    y >= shape.y - radius && y <= shape.y + shape.height + radius;
            case 'circle':
                const dist = Math.sqrt((x - shape.x) ** 2 + (y - shape.y) ** 2);
                return dist <= shape.radius + radius;
            case 'line':
                // Simplified line collision detection
                const lineLength = Math.sqrt((shape.x2 - shape.x1) ** 2 + (shape.y2 - shape.y1) ** 2);
                const distToLine = Math.abs((shape.y2 - shape.y1) * x - (shape.x2 - shape.x1) * y + shape.x2 * shape.y1 - shape.y2 * shape.x1) / lineLength;
                return distToLine <= radius;
            default:
                return false;
        }
    }

    // Tool actions
    function selectTool(tool) {
        currentTool = tool;
    }

    function selectColor(color) {
        strokeColor = color;
    }

    function saveState() {
        undoStack.push(JSON.stringify(drawings));
        if (undoStack.length > 50) {
            undoStack.shift();
        }
    }

    function clearRedoStack() {
        redoStack = [];
    }

    function undo() {
        if (undoStack.length === 0) return;

        redoStack.push(JSON.stringify(drawings));
        const previousState = undoStack.pop();
        drawings = JSON.parse(previousState);
        redrawCanvas();
    }

    function redo() {
        if (redoStack.length === 0) return;

        undoStack.push(JSON.stringify(drawings));
        const nextState = redoStack.pop();
        drawings = JSON.parse(nextState);
        redrawCanvas();
    }

    function clearDrawing() {
        saveState();
        drawings = [];
        redrawCanvas();
        clearRedoStack();
    }

    function saveDrawing() {
        const drawingData = {
            drawings,
            width: canvas.width,
            height: canvas.height,
            timestamp: Date.now()
        };

        dispatch('save', { drawingData });
    }

    function loadDrawing(drawingData) {
        if (drawingData && drawingData.drawings) {
            drawings = drawingData.drawings;
            redrawCanvas();
        }
    }

    function cancelDrawing() {
        dispatch('cancel');
    }

    // Handle modal close
    function handleClose() {
        cancelDrawing();
    }
</script>

<Modal bind:open size="xl" title="Drawing" on:close={handleClose}>
    <div class="flex flex-col h-full max-h-[80vh] {className}">
        <!-- Toolbar -->
        <div class="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
            <!-- Tools -->
            <div class="flex items-center gap-2">
                {#each tools as tool}
                    <Button
                            variant={currentTool === tool.id ? 'primary' : 'ghost'}
                            size="sm"
                            className="p-2"
                            ariaLabel={tool.name}
                            on:click={() => selectTool(tool.id)}
                    >
                        <svelte:component this={tool.icon} class="w-4 h-4" />
                    </Button>
                {/each}
            </div>

            <!-- History -->
            <div class="flex items-center gap-2">
                <Button
                        variant="ghost"
                        size="sm"
                        className="p-2"
                        ariaLabel="Undo"
                        disabled={undoStack.length === 0}
                        on:click={undo}
                >
                    <Undo class="w-4 h-4" />
                </Button>

                <Button
                        variant="ghost"
                        size="sm"
                        className="p-2"
                        ariaLabel="Redo"
                        disabled={redoStack.length === 0}
                        on:click={redo}
                >
                    <Redo class="w-4 h-4" />
                </Button>

                <Button
                        variant="ghost"
                        size="sm"
                        className="p-2"
                        ariaLabel="Clear all"
                        on:click={clearDrawing}
                >
                    <Trash2 class="w-4 h-4" />
                </Button>
            </div>
        </div>

        <!-- Color Palette and Settings -->
        <div class="flex items-center gap-4 p-4 border-b border-gray-200 dark:border-gray-700">
            <!-- Colors -->
            <div class="flex items-center gap-2">
                <span class="text-sm font-medium text-gray-700 dark:text-gray-300">Color:</span>
                <div class="flex items-center gap-1">
                    {#each colors as color}
                        <button
                                class="w-6 h-6 rounded border-2 transition-all"
                                class:border-gray-400={strokeColor !== color}
                                class:border-gray-800={strokeColor === color}
                                class:ring-2={strokeColor === color}
                                class:ring-primary-500={strokeColor === color}
                                style="background-color: {color};"
                                on:click={() => selectColor(color)}
                                aria-label="Select color {color}"
                        ></button>
                    {/each}
                </div>
            </div>

            <!-- Stroke Width -->
            <div class="flex items-center gap-2">
                <span class="text-sm font-medium text-gray-700 dark:text-gray-300">Size:</span>
                <input
                        type="range"
                        min="1"
                        max="20"
                        bind:value={strokeWidth}
                        class="w-20"
                />
                <span class="text-sm text-gray-500 w-6">{strokeWidth}</span>
            </div>

            <!-- Roughness -->
            <div class="flex items-center gap-2">
                <span class="text-sm font-medium text-gray-700 dark:text-gray-300">Roughness:</span>
                <input
                        type="range"
                        min="0"
                        max="3"
                        step="0.1"
                        bind:value={roughness}
                        class="w-20"
                />
                <span class="text-sm text-gray-500 w-8">{roughness}</span>
            </div>
        </div>

        <!-- Canvas Container -->
        <div class="flex-1 overflow-auto bg-gray-100 dark:bg-gray-800 p-4">
            <div class="max-w-full max-h-full overflow-auto bg-white rounded-lg shadow-inner">
                <canvas
                        bind:this={canvas}
                        class="block border border-gray-300 dark:border-gray-600 cursor-crosshair"
                        style="max-width: 100%; height: auto;"
                        on:mousedown={startDrawing}
                        on:mousemove={draw}
                        on:mouseup={stopDrawing}
                        on:mouseleave={stopDrawing}
                        on:touchstart={startDrawing}
                        on:touchmove={draw}
                        on:touchend={stopDrawing}
                ></canvas>
            </div>
        </div>
    </div>

    <!-- Footer -->
    <div slot="footer" class="flex items-center justify-between gap-3">
        <div class="text-sm text-gray-500 dark:text-gray-400">
            Use mouse or touch to draw. Press Esc to cancel.
        </div>
        <div class="flex items-center gap-3">
            <Button variant="secondary" on:click={cancelDrawing}>
                Cancel
            </Button>
            <Button variant="primary" on:click={saveDrawing}>
                <Save class="w-4 h-4 mr-2" />
                Save Drawing
            </Button>
        </div>
    </div>
</Modal>

<style>
    canvas {
        touch-action: none;
    }
</style>