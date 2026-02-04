import React, { useEffect, useRef, useCallback } from 'react';
import { EditorView } from '@codemirror/view';
import { basicSetup } from 'codemirror';
import { EditorState } from '@codemirror/state';
import { html } from '@codemirror/lang-html';
import { oneDark } from '@codemirror/theme-one-dark';
import { keymap } from '@codemirror/view';
import { defaultKeymap, indentWithTab } from '@codemirror/commands';
import { searchKeymap, highlightSelectionMatches } from '@codemirror/search';
import { autocompletion } from '@codemirror/autocomplete';

const CodeMirrorEditor = ({ 
  value, 
  onChange, 
  onScrollToLine, 
  theme = 'dark',
  readOnly = false 
}) => {
  const editorRef = useRef(null);
  const viewRef = useRef(null);
  const onScrollToLineRef = useRef(onScrollToLine);

  useEffect(() => {
    onScrollToLineRef.current = onScrollToLine;
  }, [onScrollToLine]);

  const handleChange = useCallback((update) => {
    if (update.docChanged) {
      const newValue = update.state.doc.toString();
      onChange(newValue);
    }
  }, [onChange]);

  useEffect(() => {
    if (!editorRef.current) return;

    const extensions = [
      basicSetup,
      html(),
      keymap.of([...defaultKeymap, indentWithTab, ...searchKeymap]),
      autocompletion(),
      highlightSelectionMatches(),
      EditorView.lineWrapping,
      EditorView.theme({
        '&': {
          fontSize: '14px',
          height: '100%',
        },
        '.cm-scroller': {
          fontFamily: "'Monaco', 'Menlo', 'Ubuntu Mono', monospace",
          overflow: 'auto',
        },
        '.cm-content': {
          padding: '16px',
          minHeight: '100%',
        },
        '.cm-gutters': {
          backgroundColor: theme === 'dark' ? '#1e1e1e' : '#f5f5f5',
          color: theme === 'dark' ? '#858585' : '#999',
          border: 'none',
        },
        '.cm-activeLineGutter': {
          backgroundColor: theme === 'dark' ? '#2c2c2c' : '#e0e0e0',
          color: theme === 'dark' ? '#fff' : '#000',
        },
        '.cm-activeLine': {
          backgroundColor: theme === 'dark' ? '#2c2c2c' : '#e0e0e0',
        },
        '.cm-focused': {
          outline: 'none',
        },
      }),
      EditorView.updateListener.of(handleChange),
    ];

    if (theme === 'dark') {
      extensions.push(oneDark);
    }

    const state = EditorState.create({
      doc: value,
      extensions: extensions,
    });

    const view = new EditorView({
      state,
      parent: editorRef.current,
    });

    viewRef.current = view;

    return () => {
      view.destroy();
      viewRef.current = null;
    };
  }, [theme]);

  useEffect(() => {
    if (viewRef.current) {
      const currentDoc = viewRef.current.state.doc.toString();
      if (currentDoc !== value) {
        viewRef.current.dispatch({
          changes: {
            from: 0,
            to: currentDoc.length,
            insert: value,
          },
        });
      }
    }
  }, [value]);

  const scrollToLine = useCallback((lineNumber) => {
    if (viewRef.current) {
      const line = viewRef.current.state.doc.line(lineNumber);
      viewRef.current.dispatch({
        effects: EditorView.scrollIntoView(line.from, { y: 'center' }),
      });
      
      viewRef.current.focus();
      viewRef.current.dispatch({
        selection: { anchor: line.from, head: line.to },
      });
    }
  }, []);

  useEffect(() => {
    if (onScrollToLineRef.current) {
      onScrollToLineRef.current(scrollToLine);
    }
  }, [scrollToLine]);

  return (
    <div 
      ref={editorRef} 
      className="w-full h-full overflow-hidden"
      style={{ 
        backgroundColor: theme === 'dark' ? '#1e1e1e' : '#ffffff',
      }}
    />
  );
};

export default CodeMirrorEditor;
