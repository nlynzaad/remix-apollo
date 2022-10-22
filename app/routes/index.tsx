import { gql, useQuery } from '@apollo/client';
import { useEffect, useState } from 'react';

const LOCATIONS_QUERY = gql`
	query Location($id: ID!) {
		location(id: $id) {
			id
			name
			photo
		}
	}
`;
export default function Index() {
	const [loc, setLoc] = useState('loc-1');

	const { data } = useQuery(LOCATIONS_QUERY, {
		variables: { id: loc },
	});

	return (
		<div>
			<div>
				<button onClick={() => setLoc('loc-1')} disabled={loc === 'loc-1'}>
					loc-1
				</button>
				<button onClick={() => setLoc('loc-2')} disabled={loc === 'loc-2'}>
					loc-2
				</button>
			</div>
			<div>{JSON.stringify(data)}</div>
		</div>
	);
}
