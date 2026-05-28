import { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../app/hooks';
import CarIcon from '../components/CarIcon';
import { WINNERS_PAGE_SIZE } from '../constants/common';
import { setWinnersPage } from '../features/ui/uiSlice';
import { loadWinners, setWinnersSort } from '../features/winners/winnersSlice';

function WinnersPage(): JSX.Element {
  const dispatch = useAppDispatch();
  const winnersPage = useAppSelector((s) => s.ui.winnersPage);
  const { totalCount, loading, error, sort, order } = useAppSelector((s) => s.winners);
  const pagesTotal = Math.max(1, Math.ceil(totalCount / WINNERS_PAGE_SIZE));

  useEffect(() => {
    dispatch(loadWinners()).catch(() => null);
  }, [dispatch, winnersPage, sort, order]);

  return (
    <section className="page-card">
      <h1 className="page-title">Winners ({totalCount})</h1>
      {error ? <p>{error}</p> : null}
      {loading ? <p>Loading...</p> : <WinnersTable />}
      <WinnersPagination pagesTotal={pagesTotal} />
    </section>
  );
}

function WinnersTable(): JSX.Element {
  const items = useAppSelector((s) => s.winners.items);
  const winnersPage = useAppSelector((s) => s.ui.winnersPage);
  const sort = useAppSelector((s) => s.winners.sort);
  const order = useAppSelector((s) => s.winners.order);

  return (
    <table className="winners-table" cellPadding={8}>
      <WinnersHead sort={sort} order={order} />
      <tbody>
        {items.map((winner, index) => (
          <WinnerRow key={winner.id} index={index} winner={winner} winnersPage={winnersPage} />
        ))}
      </tbody>
    </table>
  );
}

function WinnersHead({ sort, order }: { sort: string; order: string }): JSX.Element {
  const dispatch = useAppDispatch();

  return (
    <thead>
      <tr>
        <th>№</th>
        <th>Car</th>
        <th>Name</th>
        <th>
          <SortButton
            active={sort === 'wins'}
            order={order}
            title="Wins"
            onClick={() => dispatch(setWinnersSort('wins'))}
          />
        </th>
        <th>
          <SortButton
            active={sort === 'time'}
            order={order}
            title="Best time (s)"
            onClick={() => dispatch(setWinnersSort('time'))}
          />
        </th>
      </tr>
    </thead>
  );
}

function WinnerRow(props: {
  index: number;
  winnersPage: number;
  winner: { id: number; wins: number; time: number; car: { name: string; color: string } | null };
}): JSX.Element {
  const { index, winner, winnersPage } = props;
  return (
    <tr>
      <td>{(winnersPage - 1) * WINNERS_PAGE_SIZE + index + 1}</td>
      <td>
        <CarIcon color={winner.car?.color ?? '#666'} width={44} />
      </td>
      <td>{winner.car?.name ?? `Car #${winner.id}`}</td>
      <td>{winner.wins}</td>
      <td>{winner.time.toFixed(2)}</td>
    </tr>
  );
}

function SortButton(props: {
  title: string;
  active: boolean;
  order: string;
  onClick: () => void;
}): JSX.Element {
  const arrow = getSortArrow(props.active, props.order);
  return (
    <button type="button" onClick={props.onClick}>
      {props.title} {arrow}
    </button>
  );
}

function getSortArrow(active: boolean, order: string): string {
  if (!active) return '';
  if (order === 'ASC') return '↑';
  return '↓';
}

function WinnersPagination({ pagesTotal }: { pagesTotal: number }): JSX.Element {
  const dispatch = useAppDispatch();
  const page = useAppSelector((s) => s.ui.winnersPage);

  return (
    <div className="pager">
      <button type="button" disabled={page <= 1} onClick={() => dispatch(setWinnersPage(page - 1))}>
        Prev
      </button>
      <span>
        Page {page} / {pagesTotal}
      </span>
      <button type="button" disabled={page >= pagesTotal} onClick={() => dispatch(setWinnersPage(page + 1))}>
        Next
      </button>
    </div>
  );
}

export default WinnersPage;
