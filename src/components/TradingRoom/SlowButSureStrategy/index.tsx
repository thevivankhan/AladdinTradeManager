export const SlowButSureStrategy = () => {
  return (
    <div className="p-4 bg-slate-800 rounded-lg border border-slate-700 space-y-4">
      <h2 className="text-xl font-bold text-emerald-400">Slow But Sure Strategy</h2>
      
      <div className="space-y-2 text-slate-300 text-sm">
        <p>This strategy focuses on consistency and risk management over quick gains.</p>
        
        <h3 className="font-bold text-white mt-4">Setup:</h3>
        <ul className="list-disc list-inside space-y-1">
          <li><strong>Trend Filter:</strong> 200 EMA (Price must be above for Buy, below for Sell)</li>
          <li><strong>Dynamic Support/Resistance:</strong> 50 EMA</li>
          <li><strong>Momentum Filter:</strong> RSI (14)</li>
        </ul>

        <h3 className="font-bold text-white mt-4">Rules:</h3>
        <ul className="list-disc list-inside space-y-1">
          <li><strong>Buy:</strong> Price &gt; 200 EMA, Price &gt; 50 EMA, RSI &gt; 50.</li>
          <li><strong>Sell:</strong> Price &lt; 200 EMA, Price &lt; 50 EMA, RSI &lt; 50.</li>
          <li><strong>Risk Management:</strong> Max 1% risk per trade.</li>
          <li><strong>Risk/Reward:</strong> Minimum 1:2.</li>
        </ul>
        
        <p className="mt-4 text-emerald-300 italic">"Patience is the key to profitability."</p>
      </div>
    </div>
  );
};
