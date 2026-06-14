import { logger } from '@/lib/logger';
import { NextRequest, NextResponse } from 'next/server';
import { executeCommand, getPrompt } from '@/lib/network/executor';
import { createInitialState } from '@/lib/network/initialState';

/**
 * REFACTOR: This API is now stateless.
 * State management must be handled by the caller (client-side).
 * Module-level global state was removed to prevent multi-user session interference.
 */

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { command, state } = body;

    // Use provided state or fallback to initial
    let currentState = state || createInitialState();

    if (!command) {
      return NextResponse.json({
        error: 'Komut gerekli'
      }, { status: 400 });
    }

    // Komutu çalıştır
    const result = executeCommand(currentState, command);

    // State'i güncelle
    let updatedState = currentState;
    if (result.success && result.newState) {
      updatedState = {
        ...currentState,
        ...result.newState
      };
    }

    // Komut geçmişine ekle
    if (command.trim() && !command.trim().startsWith('?')) {
      updatedState.commandHistory = [
        ...(updatedState.commandHistory || []).slice(-49), // Son 50 komut
        command.trim()
      ];
    }

    return NextResponse.json({
      success: result.success,
      output: result.output,
      error: result.error,
      state: updatedState,
      prompt: getPrompt(updatedState)
    });

  } catch (error) {
    logger.error('Network API Error:', error);
    return NextResponse.json({
      error: 'Sunucu hatası oluştu'
    }, { status: 500 });
  }
}

export async function GET() {
  // Return initial state for the demo
  const initialState = createInitialState();
  return NextResponse.json({
    state: initialState,
    prompt: getPrompt(initialState)
  });
}

// State sıfırlama (returns initial state)
export async function DELETE() {
  const initialState = createInitialState();
  return NextResponse.json({
    success: true,
    message: 'Switch durumu sıfırlandı',
    state: initialState,
    prompt: getPrompt(initialState)
  });
}
