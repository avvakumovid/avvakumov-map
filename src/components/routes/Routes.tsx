import { Dispatch, SetStateAction } from 'react';
import styles from './Routes.module.scss';

interface Route {
  id: number;
  name: string;
  color: string;
}

interface RadioProps {
  routes: Route[];
  currentRoute: Route | null;
  setCurrentRoute: Dispatch<SetStateAction<Route | null>>;
}

const Routes = ({ routes, currentRoute, setCurrentRoute }: RadioProps) => {
  return (
    <div className={styles.main}>
      <div className={styles.routes}>
        {routes.map(r => (
          <div className={styles.route} key={r.id}>
            <input
              onChange={() => setCurrentRoute(r)}
              type='radio'
              id={r.name}
              name='route'
              value={currentRoute?.id}
            />
            <label className={styles.label} htmlFor={r.name}>
              <span>{r.name}</span>
            </label>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Routes;
