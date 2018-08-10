import * as React from "react";
import Utilities from "../../common/utilities";


export interface IProp {
    seed?: string;
    onSeedConfirmed(seed: string): void;
}

class State {
    constructor(seed?: string) {
        this.seed = seed ? seed : "";
        this.isConfirmed = seed ? true : false;
    }
    seed: string;
    isConfirmed: boolean;
}

export class SeedInput extends React.Component<IProp, State>{
    constructor(props: IProp) {
        super(props);
        this.state = new State(props.seed);
    }

    private onSeedChanged(event: React.ChangeEvent<HTMLInputElement>) {
        this.setState({ seed: event.target.value });
        event.preventDefault();
    }

    private onConfirmSeed(event: React.ChangeEvent<HTMLButtonElement>): void {
        let seed = this.state.seed;
        if (!this.state.seed) {
            seed = Utilities.randomSeed();
        }
        this.setState({ seed: seed, isConfirmed: true });
        this.props.onSeedConfirmed(seed as string);
    }

    private renderInputMode() {
        return <div>
                <div>
                    <h5>
                        Step 1: Specify a channel by using seed
                    </h5>    
                    <p>
                        In MAM protocol, data is stored by channels in IOTA tangle. The channel's seed is a sort of private key that authorize you to publish data into that channel.
                        The seed should be well protected, so people can ensure it is only you, the channel owner, can publish data into your channel.
                    </p>   
                    <p>
                        Typically one data source (i.e. a sensor) owns one seed, and therefore, it owns a dedicated channel. One people or one company can have multiple seeds and channels.
                    </p> 
                </div>
                <div className="form-row align-items-center">
                   <div className="col-sm-4">
                       <label className="sr-only" htmlFor="seedInput">Seed</label>
                       <div className="input-group mb-2">
                           <div className="input-group-prepend">
                               <div className="input-group-text"><i className="fas fa-seedling"></i></div>
                           </div>
                           <input value={this.state.seed} onChange={this.onSeedChanged.bind(this)} type="text" className="form-control" id="seedInput" placeholder="Input the seed or use generate button to create a new one" />
                       </div>
                   </div>
                   <div className="col-auto">
                       <button onClick={this.onConfirmSeed.bind(this)} type="button" className="btn btn-primary mb-2">{this.state.seed ? "Next" : "Generate"}</button>
                   </div>
                </div>
                <p>
                        You can input an existing seed for sending data into an existing channel, or generate a new seed (and new channel) for publishing data.
                </p>
                    <p>
                        {/* an empty p section for having some space */}
                    </p>
               </div>;
    }

    private renderConfirmedMode() {
        return <div className="card">
                <div className="card-header">
                    Seed of current channel
                </div>
                <div className="card-body">
                    <div className="form-group row">
                        <label htmlFor="inputPassword6" className="col-sm-2 col-form-label">Seed value:</label>
                        <div className="col-sm-10">
                            <input value={this.state.seed} type="text" id="seedReadonlyInput" readOnly={true} className="form-control"/>
                        </div>
                    </div>
                </div>
               </div>;
    }

    render() {
        return <React.Fragment>
                   {this.state.isConfirmed ? this.renderConfirmedMode() : this.renderInputMode()}
               </React.Fragment>;
    }
}
