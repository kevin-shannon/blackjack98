import { useLayoutEffect, useRef } from 'react';
import { Dialog } from '../../../shared/ui/Dialog';
import { ActionButton } from '../../../shared/ui/ActionButton';
import { value } from '../../blackjack/model/cards';
import type { PlayerAction } from '../../blackjack/model/types';
import { CHART_DEALERS, getStrategyChart } from '../model/chart';
import { ACTION_LABELS } from '../model/strategy';
import type { StrategyQuestion, StrategyRules } from '../model/types';

const symbols: Record<PlayerAction, string> = {
  hit: 'H',
  stand: 'S',
  double: 'D',
  split: 'P',
  surrender: 'R',
};

export function StrategyChart({
  question,
  rules,
  onClose,
}: {
  question: StrategyQuestion;
  rules: StrategyRules;
  onClose: () => void;
}) {
  const chart = getStrategyChart(question, rules);
  const selected = useRef<HTMLTableCellElement>(null);
  useLayoutEffect(() => {
    selected.current?.scrollIntoView({ block: 'nearest', inline: 'nearest' });
  }, [question.id]);
  return (
    <Dialog
      title="Blackjack 98 — Basic Strategy Chart"
      className="strategy-chart-modal"
      onCancel={onClose}
      initialFocus="dialog"
    >
      <h2>{chart.family} strategy</h2>
      <p className="chart-rules">
        {rules.hitSoft17 ? 'H17' : 'S17'} ·{' '}
        {rules.doubleAfterSplit ? 'DAS' : 'No DAS'} ·{' '}
        {rules.surrender ? 'Late surrender' : 'No surrender'}
      </p>
      <p className="chart-instructions">
        Dealer upcard across the top; your hand down the left. The highlighted
        cell is your hand.
      </p>
      <div
        className="chart-scroll"
        role="region"
        aria-label="Strategy chart table"
        tabIndex={0}
      >
        <table className="strategy-chart">
          <caption className="visually-hidden">
            {chart.family} basic strategy for the selected table rules
          </caption>
          <thead>
            <tr>
              <th scope="col">{chart.family === 'Pair' ? 'Pair' : 'Total'}</th>
              {CHART_DEALERS.map((rank) => (
                <th
                  key={rank}
                  scope="col"
                  className={
                    value({ rank }) === chart.dealer
                      ? 'chart-heading-current'
                      : ''
                  }
                >
                  {rank}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {chart.rows.map((row) => (
              <tr key={row.total}>
                <th
                  scope="row"
                  className={
                    row.total === chart.selectedRow
                      ? 'chart-heading-current'
                      : ''
                  }
                >
                  {row.label}
                </th>
                {row.actions.map((action, column) => {
                  const current =
                    row.total === chart.selectedRow &&
                    value({ rank: CHART_DEALERS[column] }) === chart.dealer;
                  return (
                    <td
                      key={CHART_DEALERS[column]}
                      data-chart-action={action}
                      ref={current ? selected : undefined}
                      aria-current={current ? 'true' : undefined}
                      className={current ? 'chart-current' : ''}
                      title={ACTION_LABELS[action]}
                      aria-label={`${chart.family} ${row.label} versus dealer ${CHART_DEALERS[column]}: ${ACTION_LABELS[action]}${current ? '. Your hand' : ''}`}
                    >
                      {symbols[action]}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="chart-legend" aria-label="Chart key">
        {(Object.keys(symbols) as PlayerAction[])
          .filter((action) =>
            action === 'split'
              ? chart.family === 'Pair'
              : action !== 'surrender' || rules.surrender,
          )
          .map((action) => (
            <span key={action}>
              <b data-chart-action={action}>{symbols[action]}</b> ={' '}
              {ACTION_LABELS[action]}
            </span>
          ))}
      </div>
      <div className="modal-actions settings-actions">
        <ActionButton onClick={onClose}>Close</ActionButton>
      </div>
    </Dialog>
  );
}
