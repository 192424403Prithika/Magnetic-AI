import React, { useEffect, useRef } from 'react';
import Plotly from 'plotly.js-dist-min';

export default function PlotlyChart({ data = [], layout = {}, config = {}, style = {}, className = "" }) {
  const containerRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const defaultLayout = {
      autosize: true,
      paper_bgcolor: 'transparent',
      plot_bgcolor: 'rgba(11, 21, 48, 0.4)',
      font: {
        family: 'Inter, system-ui, sans-serif',
        color: '#E2E8F0',
        size: 11
      },
      margin: { l: 55, r: 25, t: 35, b: 45 },
      xaxis: {
        gridcolor: 'rgba(27, 53, 115, 0.4)',
        zerolinecolor: 'rgba(20, 184, 166, 0.6)',
        zerolinewidth: 1.5,
        tickfont: { color: '#94A3B8', size: 10 }
      },
      yaxis: {
        gridcolor: 'rgba(27, 53, 115, 0.4)',
        zerolinecolor: 'rgba(20, 184, 166, 0.6)',
        zerolinewidth: 1.5,
        tickfont: { color: '#94A3B8', size: 10 }
      },
      ...layout
    };

    const defaultConfig = {
      responsive: true,
      displayModeBar: true,
      displaylogo: false,
      modeBarButtonsToRemove: ['lasso2d', 'select2d'],
      ...config
    };

    Plotly.react(containerRef.current, data, defaultLayout, defaultConfig);

    const handleResize = () => {
      if (containerRef.current) {
        Plotly.Plots.resize(containerRef.current);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      if (containerRef.current) {
        Plotly.purge(containerRef.current);
      }
    };
  }, [data, layout, config]);

  return (
    <div 
      ref={containerRef} 
      style={{ width: '100%', minHeight: '340px', ...style }} 
      className={`relative w-full ${className}`}
    />
  );
}
